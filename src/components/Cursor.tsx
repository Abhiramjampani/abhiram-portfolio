"use client";

import { useEffect, useRef } from "react";

/**
 * Custom cursor: a sharp dot, a trailing ring that swells over links, and a
 * trail of snowflakes (Stark) or embers (Targaryen). Also powers
 * `data-magnetic` buttons, which lean toward the pointer.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const trail = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.documentElement.classList.add("custom-cursor");

    const c = trail.current!;
    const ctx = c.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const resize = () => {
      c.width = window.innerWidth * dpr;
      c.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const mouse = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };
    let hover = false;
    let down = false;
    type Spark = { x: number; y: number; vx: number; vy: number; life: number; r: number };
    const sparks: Spark[] = [];
    let magnet: HTMLElement | null = null;

    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - mouse.x;
      const dy = e.clientY - mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      const speed = Math.min(Math.hypot(dx, dy), 60);
      const n = speed > 4 ? Math.ceil(speed / 14) : 0;
      for (let i = 0; i < n; i++) {
        sparks.push({
          x: mouse.x + (Math.random() - 0.5) * 6,
          y: mouse.y + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 0.6 - dx * 0.02,
          vy: (Math.random() - 0.5) * 0.6 - dy * 0.02,
          life: 1,
          r: 0.8 + Math.random() * 1.8,
        });
      }
      if (sparks.length > 160) sparks.splice(0, sparks.length - 160);

      const target = e.target as HTMLElement;
      hover = !!target.closest("a, button, [data-cursor]");

      const m = target.closest<HTMLElement>("[data-magnetic]");
      if (magnet && magnet !== m) magnet.style.transform = "";
      magnet = m;
      if (m) {
        const r = m.getBoundingClientRect();
        const mx = (e.clientX - (r.left + r.width / 2)) * 0.25;
        const my = (e.clientY - (r.top + r.height / 2)) * 0.35;
        m.style.transform = `translate(${mx}px, ${my}px)`;
      }
    };
    const onDown = () => (down = true);
    const onUp = () => (down = false);
    const onLeave = () => {
      mouse.x = mouse.y = -100;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("pointerleave", onLeave);

    let raf = 0;
    const loop = () => {
      const fire = document.documentElement.dataset.theme === "targaryen";
      ringPos.x += (mouse.x - ringPos.x) * 0.18;
      ringPos.y += (mouse.y - ringPos.y) * 0.18;
      const scale = (hover ? 1.9 : 1) * (down ? 0.8 : 1);
      if (dot.current) dot.current.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%) scale(${hover ? 0 : 1})`;
      if (ring.current) {
        ring.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%) scale(${scale})`;
        ring.current.dataset.hover = hover ? "1" : "0";
      }

      ctx.clearRect(0, 0, c.width, c.height);
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life -= fire ? 0.022 : 0.016;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        s.x += s.vx;
        s.y += s.vy + (fire ? -0.55 : 0.45); // embers rise, snow drifts down
        s.vx *= 0.97;
        s.vy *= 0.97;
        const a = s.life * (fire ? 0.9 : 0.75);
        ctx.beginPath();
        ctx.arc(s.x * dpr, s.y * dpr, s.r * dpr * (fire ? s.life : 1), 0, Math.PI * 2);
        ctx.fillStyle = fire
          ? `rgba(255,${Math.round(120 + 100 * s.life)},${Math.round(40 * s.life)},${a})`
          : `rgba(225,240,255,${a})`;
        ctx.shadowBlur = 8 * dpr;
        ctx.shadowColor = fire ? "rgba(255,120,40,0.9)" : "rgba(170,210,255,0.8)";
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
      document.documentElement.classList.remove("custom-cursor");
    };
  }, []);

  return (
    <div aria-hidden className="cursor-layer pointer-events-none fixed inset-0 z-[200]">
      <canvas ref={trail} className="absolute inset-0 h-full w-full" />
      <div ref={ring} className="cursor-ring" />
      <div ref={dot} className="cursor-dot" />
    </div>
  );
}
