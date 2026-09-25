"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { House } from "@/lib/house";

/* ------------------------------------------------------------------
   Per-house look. Lights, fog and particles lerp toward these targets
   every frame, so switching houses melts from frost into fire.
   ------------------------------------------------------------------ */
const LOOKS = {
  stark: {
    fog: new THREE.Color("#080b10"),
    beam: new THREE.Color("#bfe0ff"),
    rim: new THREE.Color("#6fb6ff"),
    rimIntensity: 60,
    key: new THREE.Color("#dcecff"),
    particle: new THREE.Color("#eef6ff"),
    steel: new THREE.Color("#8a96a3"),
    direction: -1, // snow falls
    flicker: 0,
  },
  targaryen: {
    fog: new THREE.Color("#090605"),
    beam: new THREE.Color("#ffb36b"),
    rim: new THREE.Color("#ff4d1a"),
    rimIntensity: 90,
    key: new THREE.Color("#ffd2a1"),
    particle: new THREE.Color("#ff9440"),
    steel: new THREE.Color("#6b5f58"),
    direction: 1, // embers rise
    flicker: 1,
  },
} as const;

/* Seeded PRNG so the throne is identical on every render. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* A single longsword pointing along +Y, pommel at the origin. */
function makeSwordGeometry() {
  const blade = new THREE.Shape();
  blade.moveTo(-0.042, 0.36);
  blade.lineTo(0.042, 0.36);
  blade.lineTo(0.034, 1.82);
  blade.lineTo(0, 2.0);
  blade.lineTo(-0.034, 1.82);
  blade.closePath();
  const bladeGeo = new THREE.ExtrudeGeometry(blade, {
    depth: 0.01,
    bevelEnabled: true,
    bevelThickness: 0.007,
    bevelSize: 0.008,
    bevelSegments: 1,
  });
  bladeGeo.translate(0, 0, -0.005);

  const guard = new THREE.BoxGeometry(0.34, 0.035, 0.05);
  guard.translate(0, 0.34, 0);
  const grip = new THREE.CylinderGeometry(0.017, 0.02, 0.27, 10);
  grip.translate(0, 0.19, 0);
  const pommel = new THREE.SphereGeometry(0.036, 12, 8);
  pommel.translate(0, 0.04, 0);

  const parts = [bladeGeo, guard, grip, pommel].map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    n.deleteAttribute("uv");
    return n;
  });
  const merged = mergeGeometries(parts)!;
  merged.computeVertexNormals();
  return merged;
}

type SwordXf = { p: THREE.Vector3; r: THREE.Euler; s: number; w: number; tint: number };

/* Lays out ~150 swords into the silhouette of the Iron Throne. */
function buildThrone(): SwordXf[] {
  const rand = rng(1337);
  const out: SwordXf[] = [];
  const add = (p: THREE.Vector3, r: THREE.Euler, s: number) => out.push({ p, r, s, w: 0.85 + rand() * 0.25, tint: 0.55 + rand() * 0.45 });

  // The great fan of blades behind the seat — tallest at the centre.
  const layers = [
    { z: -0.48, count: 34, spread: 0.42, tall: 1.2, tilt: -0.08 },
    { z: -0.58, count: 30, spread: 0.55, tall: 0.95, tilt: -0.14 },
    { z: -0.68, count: 26, spread: 0.7, tall: 0.6, tilt: -0.22 },
    { z: -0.78, count: 20, spread: 0.85, tall: 0.3, tilt: -0.3 },
  ];
  for (const L of layers) {
    for (let i = 0; i < L.count; i++) {
      const t = i / (L.count - 1) - 0.5; // -0.5 … 0.5
      const a = t * L.spread * 2 + (rand() - 0.5) * 0.08;
      const center = Math.cos(t * Math.PI);
      const s = (0.7 + L.tall * center * center) * (0.88 + rand() * 0.2);
      const base = new THREE.Vector3(Math.sin(a) * 0.5 + t * 0.5 + (rand() - 0.5) * 0.06, 0.95 + rand() * 0.06, L.z + (rand() - 0.5) * 0.08);
      add(base, new THREE.Euler(L.tilt + (rand() - 0.5) * 0.08, (rand() - 0.5) * 0.5, -a), s);
    }
  }

  // Blades plunged downward around the seat — the legs of the throne.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      const z = -0.42 + i * 0.1 + (rand() - 0.5) * 0.04;
      add(
        new THREE.Vector3(side * (0.62 + rand() * 0.06), 1.52 + rand() * 0.12, z),
        new THREE.Euler((rand() - 0.5) * 0.12, (rand() - 0.5) * 0.6, Math.PI + side * (0.08 + rand() * 0.1)),
        0.55 + rand() * 0.1,
      );
    }
  }
  // Front apron of blades beneath the seat edge.
  for (let i = 0; i < 12; i++) {
    const x = -0.55 + i * 0.1 + (rand() - 0.5) * 0.03;
    add(
      new THREE.Vector3(x, 1.5 + rand() * 0.1, 0.5 + rand() * 0.04),
      new THREE.Euler(0.08 + rand() * 0.1, (rand() - 0.5) * 0.4, Math.PI + (rand() - 0.5) * 0.15),
      0.52 + rand() * 0.08,
    );
  }

  // Armrests: blades pointing forward with pommels jutting out.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      add(
        new THREE.Vector3(side * (0.62 + (rand() - 0.5) * 0.12), 1.22 + i * 0.035, -0.55),
        new THREE.Euler(Math.PI / 2 + (rand() - 0.5) * 0.2, 0, side * (0.1 + rand() * 0.25)),
        0.55 + rand() * 0.12,
      );
    }
  }

  // Swords strewn over the dais steps.
  for (let i = 0; i < 26; i++) {
    const ang = rand() * Math.PI * 2;
    const rad = 0.95 + rand() * 0.35;
    const step = rad > 1.12 ? 0.16 : 0.31;
    add(
      new THREE.Vector3(Math.cos(ang) * rad, step + 0.02, Math.sin(ang) * rad * 0.85),
      new THREE.Euler(Math.PI / 2 + (rand() - 0.5) * 0.15, 0, rand() * Math.PI * 2),
      0.45 + rand() * 0.2,
    );
  }
  return out;
}

function IronThrone({ house }: { house: House }) {
  const swords = useRef<THREE.InstancedMesh>(null);
  const steel = useRef<THREE.MeshStandardMaterial>(null);
  const geometry = useMemo(() => makeSwordGeometry(), []);
  const layout = useMemo(() => buildThrone(), []);

  useLayoutEffect(() => {
    const m = swords.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    layout.forEach((x, i) => {
      o.position.copy(x.p);
      o.rotation.copy(x.r);
      // Stretch length only, so long blades stay slender.
      o.scale.set(x.w, x.s, x.w);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c.setScalar(x.tint));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [layout]);

  useFrame((_, dt) => {
    steel.current?.color.lerp(LOOKS[house].steel, 1 - Math.pow(0.05, dt));
  });

  return (
    <group>
      <instancedMesh ref={swords} args={[geometry, undefined, layout.length]} castShadow receiveShadow>
        <meshStandardMaterial ref={steel} color={LOOKS.stark.steel} metalness={0.95} roughness={0.3} envMapIntensity={1.1} />
      </instancedMesh>

      {/* Seat and backing, forged dark iron */}
      <mesh position={[0, 1.2, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.16, 0.95]} />
        <meshStandardMaterial color="#1b1c1f" metalness={0.8} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.02, -0.05]} castShadow>
        <boxGeometry args={[1.05, 0.2, 0.85]} />
        <meshStandardMaterial color="#121315" metalness={0.7} roughness={0.55} />
      </mesh>

      {/* Stone dais */}
      {[
        [2.9, 0.16, 2.5, 0.08],
        [2.35, 0.15, 2.0, 0.235],
        [1.8, 0.15, 1.6, 0.385],
      ].map(([w, h, d, y], i) => (
        <mesh key={i} position={[0, y, -0.1]} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#1c1e22" roughness={0.85} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

/* A soft volumetric shaft of light falling onto the throne. */
function LightBeam({ house }: { house: House }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uColor: { value: LOOKS.stark.beam.clone() }, uTime: { value: 0 } }), []);
  useFrame((s, dt) => {
    if (!mat.current) return;
    mat.current.uniforms.uColor.value.lerp(LOOKS[house].beam, 1 - Math.pow(0.05, dt));
    mat.current.uniforms.uTime.value = s.clock.elapsedTime;
  });
  return (
    <mesh position={[0, 4.6, 0.2]}>
      <cylinderGeometry args={[0.25, 1.9, 9.2, 48, 1, true]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        vertexShader={/* glsl */ `
          varying vec2 vUv;
          varying vec3 vN;
          varying vec3 vView;
          void main() {
            vUv = uv;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vN = normalize(normalMatrix * normal);
            vView = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={/* glsl */ `
          uniform vec3 uColor;
          uniform float uTime;
          varying vec2 vUv;
          varying vec3 vN;
          varying vec3 vView;
          void main() {
            float edge = pow(abs(dot(vN, vView)), 2.2);
            float h = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
            float dust = 0.85 + 0.15 * sin(vUv.x * 40.0 + uTime * 0.6) * sin(vUv.y * 18.0 - uTime * 0.4);
            gl_FragColor = vec4(uColor, edge * h * dust * 0.09);
          }
        `}
      />
    </mesh>
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
      pos[i * 3] = (random() - 0.5) * 18;
      pos[i * 3 + 1] = random() * 10;
      pos[i * 3 + 2] = (random() - 0.5) * 10;
      seed[i] = random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDir: { value: LOOKS.stark.direction as number },
      uColor: { value: LOOKS.stark.particle.clone() },
      uPixelRatio: { value: 1 },
    }),
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
    <points geometry={geometry} frustumCulled={false}>
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
            float speed = 0.2 + aSeed * 0.5;
            p.y = mod(p.y + uDir * uTime * speed, 10.0) - 0.5;
            p.x += sin(uTime * (0.3 + aSeed) + aSeed * 40.0) * 0.4;
            p.z += cos(uTime * 0.4 + aSeed * 20.0) * 0.25;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            float flicker = 0.55 + 0.45 * sin(uTime * 3.0 + aSeed * 60.0);
            vAlpha = mix(0.3, 1.0, aSeed) * mix(1.0, flicker, step(0.0, uDir));
            gl_PointSize = (8.0 + aSeed * 16.0) * uPixelRatio / -mv.z;
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

/* Lights, fog and the camera — cinematic push-in on scroll, parallax on pointer. */
function Stage({ house, children }: { house: House; children: React.ReactNode }) {
  const viewport = useThree((s) => s.viewport);
  const fog = useRef<THREE.FogExp2>(null);
  const bg = useRef<THREE.Color>(null);
  const rimL = useRef<THREE.PointLight>(null);
  const rimR = useRef<THREE.PointLight>(null);
  const key = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const look = useRef(new THREE.Vector3());

  const wide = viewport.aspect > 1.1;
  const offsetX = wide ? 2.4 : 0;

  useFrame((state, dt) => {
    const L = LOOKS[house];
    const k = 1 - Math.pow(0.05, dt);
    fog.current?.color.lerp(L.fog, k);
    bg.current?.lerp(L.fog, k);
    const { camera, pointer } = state;

    const t = state.clock.elapsedTime;
    const flick = L.flicker * (Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.1 + Math.sin(t * 23) * 0.05);
    for (const l of [rimL.current, rimR.current]) {
      if (!l) continue;
      l.color.lerp(L.rim, k);
      l.intensity = THREE.MathUtils.lerp(l.intensity, L.rimIntensity * (1 + flick), k * 2);
    }
    key.current?.color.lerp(L.key, k);

    // Scroll progress through the hero: 0 at top, 1 once scrolled a full screen.
    const s = Math.min(window.scrollY / window.innerHeight, 1);
    const cx = offsetX * 0.15 + pointer.x * 0.45;
    const cy = (wide ? 2.4 : 3.0) + pointer.y * 0.25 - s * 0.5;
    const cz = (wide ? 10.8 : 12.5) - s * 2.5;
    camera.position.x += (cx - camera.position.x) * 0.05;
    camera.position.y += (cy - camera.position.y) * 0.05;
    camera.position.z += (cz - camera.position.z) * 0.05;
    look.current.set(offsetX * 0.55, wide ? 1.85 : 0.6, 0);
    camera.lookAt(look.current);
  });

  return (
    <>
      {/* Opaque backdrop in the fog colour, so floor and sky meet with no horizon line. */}
      <color ref={bg} attach="background" args={[LOOKS.stark.fog]} />
      <fogExp2 ref={fog} attach="fog" args={[LOOKS.stark.fog.getHex(), 0.075]} />
      <ambientLight intensity={0.08} />
      <primitive object={target} position={[offsetX, 1, 0]} />
      <spotLight
        ref={key}
        position={[offsetX, 9, 2.5]}
        target={target}
        angle={0.42}
        penumbra={0.9}
        intensity={180}
        decay={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      <pointLight ref={rimL} position={[offsetX - 2.4, 2.6, -2.2]} intensity={60} distance={9} />
      <pointLight ref={rimR} position={[offsetX + 2.4, 2.2, -2.0]} intensity={60} distance={9} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={1.6} position={[0, 5, -3]} scale={[10, 2, 1]} />
        <Lightformer form="circle" intensity={0.8} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={3} />
        <Lightformer form="circle" intensity={0.6} position={[5, 2, 1]} rotation-y={-Math.PI / 2} scale={3} />
      </Environment>

      <group position={[offsetX, 0, 0]} scale={wide ? 1 : 0.9}>
        {children}
        <LightBeam house={house} />
      </group>

      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[30, 64]} />
        <meshStandardMaterial color="#0d0e10" roughness={0.55} metalness={0.3} />
      </mesh>
    </>
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
        shadows={!mobile}
        frameloop={visible ? "always" : "never"}
        dpr={[1, mobile ? 1.5 : 2]}
        camera={{ position: [0, 2.4, 11], fov: 35 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Stage house={house}>
          <IronThrone house={house} />
        </Stage>
        <Particles house={house} count={mobile ? 500 : 1600} />
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={0.7} luminanceSmoothing={0.25} intensity={0.9} />
          <Vignette offset={0.2} darkness={0.85} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
