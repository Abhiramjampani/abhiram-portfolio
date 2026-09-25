"use client";

import { useEffect, useRef } from "react";
import { useHouse } from "@/lib/house";

/** Sparse snow / embers drifting behind the page content. Cheap 2D canvas. */
export default function Ambient() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { house } = useHouse();
  const houseRef = useRef(house);

  useEffect(() => {
    houseRef.current = house;
  }, [house]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const resize = () => {
      w = c.width = window.innerWidth * dpr;
      h = c.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const n = window.innerWidth < 768 ? 35 : 80;
    const ps = Array.from({ length: n }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.6 + Math.random() * 1.8,
      s: 0.00015 + Math.random() * 0.0005,
      p: Math.random() * Math.PI * 2,
    }));

    let raf = 0;
    let dir = houseRef.current === "stark" ? 1 : -1;
    const loop = (t: number) => {
      const fire = houseRef.current === "targaryen";
      dir += ((fire ? -1 : 1) - dir) * 0.02;
      ctx.clearRect(0, 0, w, h);
      for (const q of ps) {
        q.y += q.s * dir;
        if (q.y > 1.02) q.y = -0.02;
        if (q.y < -0.02) q.y = 1.02;
        const x = (q.x + Math.sin(t * 0.0004 + q.p) * 0.01) * w;
        const a = fire ? 0.35 + 0.35 * Math.sin(t * 0.004 + q.p * 9) : 0.45;
        ctx.beginPath();
        ctx.arc(x, q.y * h, q.r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = fire ? `rgba(255,140,60,${a})` : `rgba(220,235,250,${a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-60" />;
}
