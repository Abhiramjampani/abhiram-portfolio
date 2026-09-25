"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects, type Project } from "@/data/content";
import SectionHeading from "../SectionHeading";
import { Arrow, GitHub } from "../Icons";

gsap.registerPlugin(ScrollTrigger);

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
    <div data-reveal className="h-full w-full" style={{ perspective: "1200px" }}>
      <article ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className="banner panel flex h-full min-h-[30rem] flex-col overflow-hidden p-0">
        <div className="banner-shine pointer-events-none absolute inset-0 rounded-[18px]" />
        <span aria-hidden className="banner-numeral font-display pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-[10rem] leading-none">
          {NUMERALS[i]}
        </span>
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
  const root = useRef<HTMLElement>(null);

  // On large screens the section pins and the banners ride past horizontally.
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const track = root.current!.querySelector<HTMLElement>("[data-htrack]")!;
      const dist = () => track.scrollWidth - window.innerWidth;
      gsap.to(track, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          pin: true,
          scrub: 1,
          end: () => "+=" + dist(),
          invalidateOnRefresh: true,
        },
      });
      gsap.fromTo("[data-hprogress]", { scaleX: 0 }, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: () => "+=" + dist(), scrub: true },
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section id="projects" ref={root} className="relative isolate overflow-hidden py-24 md:py-32 lg:flex lg:h-screen lg:items-center lg:py-0">
      <div className="fog-band" aria-hidden />
      <div data-htrack className="flex flex-col gap-7 px-5 md:px-10 lg:w-max lg:flex-row lg:items-stretch lg:gap-10 lg:px-[8vw]">
        <div className="flex shrink-0 items-center lg:w-[32vw]">
          <SectionHeading
            label="Projects"
            title="Conquests"
            align="left"
            intro="Campaigns built end to end — from smart contracts to C++ addons."
          />
        </div>
        {projects.map((p, i) => (
          <div key={p.name} className="shrink-0 lg:flex lg:w-[28rem] lg:items-center">
            <BannerCard p={p} i={i} />
          </div>
        ))}
        <div className="hidden shrink-0 lg:block lg:w-[4vw]" />
      </div>
      <div className="absolute bottom-10 left-[8vw] right-[8vw] hidden h-px bg-[var(--border)] lg:block">
        <div data-hprogress className="h-full origin-left bg-accent" style={{ boxShadow: "0 0 10px var(--accent-glow)" }} />
      </div>
      <style>{`
        .banner { transform-style: preserve-3d; transform: rotateX(var(--rx,0)) rotateY(var(--ry,0)); transition: transform .5s cubic-bezier(.2,.8,.2,1), border-color .4s, box-shadow .4s; }
        .banner:hover { transition: transform .12s linear, border-color .4s, box-shadow .4s; }
        .banner-shine { opacity: 0; transition: opacity .4s; background: radial-gradient(420px circle at var(--mx,50%) var(--my,50%), color-mix(in srgb, var(--accent) 16%, transparent), transparent 45%); }
        .banner:hover .banner-shine { opacity: 1; }
        .banner-tab { background: var(--metal); clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%); margin-top: -1.75rem; }
        .banner-numeral { -webkit-text-stroke: 1px color-mix(in srgb, var(--accent) 14%, transparent); color: transparent; }
      `}</style>
    </section>
  );
}
