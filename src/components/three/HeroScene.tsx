"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { House } from "@/lib/house";

/* ------------------------------------------------------------------
   Per-house look. Everything lerps toward these targets each frame,
   so switching houses melts smoothly from frost to fire.
   ------------------------------------------------------------------ */
const LOOKS = {
  stark: {
    egg: new THREE.Color("#d3e4f1"),
    emissive: new THREE.Color("#6cc0ff"),
    emissiveIntensity: 1.5,
    metalness: 0.45,
    roughness: 0.2,
    iridescence: 0.7,
    env: 1.2,
    rim: new THREE.Color("#8fc6ff"),
    particle: new THREE.Color("#e8f3ff"),
    direction: -1, // snow falls
  },
  targaryen: {
    egg: new THREE.Color("#3a0f0a"),
    emissive: new THREE.Color("#ff5a1f"),
    emissiveIntensity: 2.6,
    metalness: 0.85,
    roughness: 0.34,
    iridescence: 0,
    env: 0.45,
    rim: new THREE.Color("#ff6b2c"),
    particle: new THREE.Color("#ff9a3c"),
    direction: 1, // embers rise
  },
} as const;

/* Seeded PRNG so procedural content is deterministic across renders. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Procedural dragon-scale textures drawn on a canvas once. */
function useScaleTextures() {
  return useMemo(() => {
    const random = rng(7);
    const size = 1024;
    const make = () => {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      return [c, c.getContext("2d")!] as const;
    };
    const [colorC, color] = make();
    const [bumpC, bump] = make();
    const [emC, em] = make();

    color.fillStyle = "#2a2a2a";
    color.fillRect(0, 0, size, size);
    bump.fillStyle = "#000";
    bump.fillRect(0, 0, size, size);
    em.fillStyle = "#000";
    em.fillRect(0, 0, size, size);

    // Even row count with an exact fit keeps the texture seamless when tiled.
    const cols = 16;
    const w = size / cols;
    const rows = 26;
    const h = size / rows;

    // Draw bottom-up so each row overlaps the one below, like real scales.
    for (let r = rows + 1; r >= -2; r--) {
      for (let i = -1; i <= cols; i++) {
        const x = i * w + (r % 2 ? w / 2 : 0);
        const y = r * h;
        const drawScale = (ctx: CanvasRenderingContext2D, fill: CanvasGradient | string) => {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(x, y + h * 1.25, x + w / 2, y + h * 1.55);
          ctx.quadraticCurveTo(x + w, y + h * 1.25, x + w, y);
          ctx.closePath();
          ctx.fillStyle = fill;
          ctx.fill();
        };
        const jitter = 0.85 + random() * 0.3;

        const g = color.createRadialGradient(x + w / 2, y + h * 0.3, 2, x + w / 2, y + h * 0.7, w * 0.8);
        g.addColorStop(0, `rgba(${255 * jitter},${255 * jitter},${255 * jitter},1)`);
        g.addColorStop(1, "rgba(70,70,70,1)");
        drawScale(color, g);

        const b = bump.createRadialGradient(x + w / 2, y + h * 0.4, 1, x + w / 2, y + h * 0.9, w * 0.75);
        b.addColorStop(0, "#fff");
        b.addColorStop(1, "#222");
        drawScale(bump, b);

        // Glowing seam along the scale edge.
        em.beginPath();
        em.moveTo(x, y);
        em.quadraticCurveTo(x, y + h * 1.25, x + w / 2, y + h * 1.55);
        em.quadraticCurveTo(x + w, y + h * 1.25, x + w, y);
        em.strokeStyle = `rgba(255,255,255,${0.35 + random() * 0.5})`;
        em.lineWidth = 2.2;
        em.shadowColor = "#fff";
        em.shadowBlur = 6;
        em.stroke();
        drawScale(em, "rgba(0,0,0,0.92)");
      }
    }

    const tex = (c: HTMLCanvasElement, srgb = false) => {
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2, 2);
      t.anisotropy = 8;
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };
    return { map: tex(colorC, true), bumpMap: tex(bumpC), emissiveMap: tex(emC, true) };
  }, []);
}

function DragonEgg({ house }: { house: House }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);
  const rim = useRef<THREE.PointLight>(null);
  const textures = useScaleTextures();
  const { viewport, pointer } = useThree();

  const geometry = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const n = 96;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const y = -Math.cos(Math.PI * t) * 1.4;
      // Egg profile: slightly fuller toward the base.
      const r = Math.sin(Math.PI * t) * 0.95 * (1 - 0.13 * (y / 1.4));
      pts.push(new THREE.Vector2(Math.max(r, 0.0001), y));
    }
    const g = new THREE.LatheGeometry(pts, 128);
    g.computeVertexNormals();
    return g;
  }, []);

  useFrame((state, dt) => {
    const look = LOOKS[house];
    const k = 1 - Math.pow(0.02, dt);
    if (mat.current) {
      mat.current.color.lerp(look.egg, k);
      mat.current.emissive.lerp(look.emissive, k);
      mat.current.emissiveIntensity = THREE.MathUtils.lerp(mat.current.emissiveIntensity, look.emissiveIntensity, k);
      mat.current.metalness = THREE.MathUtils.lerp(mat.current.metalness, look.metalness, k);
      mat.current.roughness = THREE.MathUtils.lerp(mat.current.roughness, look.roughness, k);
      mat.current.iridescence = THREE.MathUtils.lerp(mat.current.iridescence, look.iridescence, k);
      mat.current.envMapIntensity = THREE.MathUtils.lerp(mat.current.envMapIntensity, look.env, k);
      // Slow "breathing" glow in the seams.
      mat.current.emissiveIntensity *= 0.85 + Math.sin(state.clock.elapsedTime * 1.4) * 0.15;
    }
    if (rim.current) rim.current.color.lerp(look.rim, k);
    if (mesh.current) {
      mesh.current.rotation.y += dt * 0.18;
      const g = mesh.current.parent!;
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -pointer.y * 0.25, 0.05);
      g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, -pointer.x * 0.12, 0.05);
    }
  });

  const wide = viewport.aspect > 1.1;
  const scale = wide ? 1 : Math.min(0.55, viewport.width / 3.2);
  const position: [number, number, number] = wide ? [viewport.width * 0.2, -0.05, 0] : [0, viewport.height * 0.22, 0];

  return (
    <group position={position} scale={scale}>
      <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.6}>
        <group rotation={[0, 0, 0.12]}>
          <mesh ref={mesh} geometry={geometry} castShadow>
            <meshPhysicalMaterial
              ref={mat}
              map={textures.map}
              bumpMap={textures.bumpMap}
              bumpScale={3}
              emissiveMap={textures.emissiveMap}
              color={LOOKS[house].egg}
              emissive={LOOKS[house].emissive}
              emissiveIntensity={LOOKS[house].emissiveIntensity}
              metalness={LOOKS[house].metalness}
              roughness={LOOKS[house].roughness}
              clearcoat={1}
              clearcoatRoughness={0.15}
              iridescence={LOOKS[house].iridescence}
              envMapIntensity={LOOKS[house].env}
            />
          </mesh>
        </group>
      </Float>
      <pointLight ref={rim} position={[-2.2, 1.5, -1.5]} intensity={30} distance={8} color={LOOKS[house].rim} />
    </group>
  );
}

/* Snow for Stark, embers for Targaryen — animated fully on the GPU. */
function Particles({ house, count }: { house: House; count: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const random = rng(42);
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (random() - 0.5) * 16;
      pos[i * 3 + 1] = (random() - 0.5) * 10;
      pos[i * 3 + 2] = (random() - 0.5) * 8 - 1;
      seed[i] = random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDir: { value: LOOKS[house].direction },
      uColor: { value: LOOKS[house].particle.clone() },
      uPixelRatio: { value: 1 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((state, dt) => {
    if (!mat.current) return;
    const look = LOOKS[house];
    const k = 1 - Math.pow(0.05, dt);
    const u = mat.current.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uDir.value = THREE.MathUtils.lerp(u.uDir.value, look.direction, k);
    u.uColor.value.lerp(look.particle, k);
    u.uPixelRatio.value = state.gl.getPixelRatio();
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={/* glsl */ `
          uniform float uTime;
          uniform float uDir;
          uniform float uPixelRatio;
          attribute float aSeed;
          varying float vAlpha;
          void main() {
            vec3 p = position;
            float speed = 0.25 + aSeed * 0.45;
            p.y = mod(p.y + uDir * uTime * speed + 5.0, 10.0) - 5.0;
            p.x += sin(uTime * (0.3 + aSeed) + aSeed * 40.0) * 0.35;
            p.z += cos(uTime * 0.4 + aSeed * 20.0) * 0.2;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            float flicker = 0.6 + 0.4 * sin(uTime * 3.0 + aSeed * 60.0);
            vAlpha = mix(0.35, 1.0, aSeed) * mix(1.0, flicker, step(0.0, uDir));
            gl_PointSize = (6.0 + aSeed * 14.0) * uPixelRatio / -mv.z;
          }
        `}
        fragmentShader={/* glsl */ `
          uniform vec3 uColor;
          varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d);
            gl_FragColor = vec4(uColor, a * a * vAlpha);
          }
        `}
      />
    </points>
  );
}

export default function HeroScene({ house }: { house: House }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [mobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);

  // Stop rendering entirely once the hero is off-screen.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, mobile ? 1.5 : 2]}
        camera={{ position: [0, 0, 6], fov: 35 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.15} />
        <directionalLight position={[3, 4, 5]} intensity={1.6} />
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={2.5} position={[0, 4, -2]} scale={[8, 1.5, 1]} />
          <Lightformer form="circle" intensity={0.8} position={[-5, 0, 1]} rotation-y={Math.PI / 2} scale={3} />
          <Lightformer form="ring" intensity={2} position={[4, 1, 3]} scale={2} />
        </Environment>
        <DragonEgg house={house} />
        <Particles house={house} count={mobile ? 450 : 1400} />
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={0.55} luminanceSmoothing={0.2} intensity={1.1} />
          <Vignette offset={0.25} darkness={0.75} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
