"use client";

import { useRef } from "react";
import { projects, type Project } from "@/data/content";
import SectionHeading from "../SectionHeading";
import { Arrow, GitHub } from "../Icons";

const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];

/** Card that tilts toward the cursor with a moving specular highlight. */
function BannerCard({ p, i }: { p: Project; i: number }) {
  const ref = useRef<HTMLElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 10}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 12}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };
  const onLeave = () => {
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  };

  return (
    <div data-reveal style={{ perspective: "1200px" }}>
      <article ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className="banner panel flex h-full flex-col overflow-hidden p-0">
        <div className="banner-shine pointer-events-none absolute inset-0 rounded-[18px]" />
        <div className="relative flex items-start justify-between p-7 pb-0">
          <span className="banner-tab font-display flex h-16 w-11 items-start justify-center pt-3 text-sm text-bg">
            {NUMERALS[i]}
          </span>
          <div className="flex gap-3">
            {p.github && (
              <a href={p.github} target="_blank" rel="noreferrer" aria-label={`${p.name} source`} className="text-muted transition-colors hover:text-accent">
                <GitHub className="h-5 w-5" />
              </a>
            )}
            {p.live && (
              <a href={p.live} target="_blank" rel="noreferrer" aria-label={`${p.name} live`} className="text-muted transition-colors hover:text-accent">
                <Arrow className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
        <div className="relative flex flex-1 flex-col p-7 pt-6" style={{ transform: "translateZ(30px)" }}>
          <h3 className="font-display text-2xl tracking-[0.06em] md:text-[1.7rem]">{p.name}</h3>
          <p className="eyebrow mt-1 text-lg">{p.subtitle}</p>
          <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">{p.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {p.stack.map((s) => (
              <span key={s} className="chip">{s}</span>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="relative mx-auto max-w-6xl px-5 py-24 md:px-10 md:py-32">
      <SectionHeading eyebrow="Conquests" title="Projects" />
      <div className="grid gap-7 md:grid-cols-3">
        {projects.map((p, i) => (
          <BannerCard key={p.name} p={p} i={i} />
        ))}
      </div>
      <style>{`
        .banner { transform-style: preserve-3d; transform: rotateX(var(--rx,0)) rotateY(var(--ry,0)); transition: transform .5s cubic-bezier(.2,.8,.2,1), border-color .4s, box-shadow .4s; }
        .banner:hover { transition: transform .12s linear, border-color .4s, box-shadow .4s; }
        .banner-shine { opacity: 0; transition: opacity .4s; background: radial-gradient(420px circle at var(--mx,50%) var(--my,50%), color-mix(in srgb, var(--accent) 16%, transparent), transparent 45%); }
        .banner:hover .banner-shine { opacity: 1; }
        .banner-tab { background: var(--metal); clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%); margin-top: -1.75rem; }
      `}</style>
    </section>
  );
}
