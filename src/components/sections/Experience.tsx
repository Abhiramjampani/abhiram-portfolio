"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { experience } from "@/data/content";
import SectionHeading from "../SectionHeading";
import { Arrow } from "../Icons";

gsap.registerPlugin(ScrollTrigger);

export default function Experience() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // The road draws itself as you travel down the page…
      gsap.fromTo(
        "[data-road]",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: "[data-road-track]", start: "top 60%", end: "bottom 60%", scrub: 0.6 },
        },
      );
      // …and each keep lights up when the road reaches it.
      gsap.utils.toArray<HTMLElement>("[data-keep]").forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 60%",
          onEnter: () => el.classList.add("is-lit"),
          onLeaveBack: () => el.classList.remove("is-lit"),
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="experience" ref={root} className="relative isolate mx-auto max-w-6xl px-5 py-24 md:px-10 md:py-32">
      <div className="fog-band" aria-hidden />
      <SectionHeading label="Experience" title="The Great Houses" intro="The houses I have sworn my sword to." />

      <div data-road-track className="relative">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-[var(--border)] md:left-1/2">
          <div data-road className="h-full w-full origin-top bg-gradient-to-b from-accent via-accent to-accent-2" style={{ boxShadow: "0 0 12px var(--accent-glow)" }} />
        </div>

        <ol className="space-y-16 md:space-y-24">
          {experience.map((job, i) => {
            const right = i % 2 === 1;
            return (
              <li key={job.company + job.period} className="relative grid md:grid-cols-2 md:gap-16">
                <span
                  data-keep
                  className="keep absolute left-[15px] top-8 z-10 h-4 w-4 -translate-x-1/2 rotate-45 border border-[var(--border-strong)] bg-bg md:left-1/2"
                />
                <div className={`hidden md:flex md:flex-col md:pt-5 ${right ? "md:order-2 md:items-start" : "md:items-end md:text-right"}`}>
                  <p className="font-display text-sm tracking-[0.25em] text-accent">{job.period}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted">{job.location}</p>
                </div>
                <article data-reveal className={`panel ml-10 p-7 md:ml-0 md:p-9 ${right ? "md:order-1" : ""} ${job.current ? "current-glow" : ""}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-2xl tracking-[0.06em] text-text md:text-3xl">{job.company}</h3>
                    {job.current && (
                      <span className="rounded-full border border-accent/50 px-2.5 py-0.5 text-[0.6rem] uppercase tracking-[0.2em] text-accent">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="eyebrow mt-1 text-lg">{job.role}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted md:hidden">{job.period}</p>
                  {job.summary && <p className="mt-5 leading-relaxed text-muted">{job.summary}</p>}
                  {job.points.length > 0 && (
                    <ul className="mt-5 space-y-3.5">
                      {job.points.map((pt) => (
                        <li key={pt} className="flex gap-3 text-[0.95rem] leading-relaxed text-muted">
                          <span className="mt-2.5 h-1 w-1 shrink-0 rotate-45 bg-accent" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {job.link && (
                    <a
                      href={job.link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent"
                    >
                      {job.link.label}
                      <Arrow className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      </div>

      <style>{`
        .keep { transition: all .6s cubic-bezier(.2,.8,.2,1); }
        .keep.is-lit { background: var(--accent); border-color: var(--accent); box-shadow: 0 0 0 6px color-mix(in srgb, var(--accent) 15%, transparent), 0 0 24px var(--accent-glow); }
        .current-glow { border-color: var(--border-strong); box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 20%, transparent), 0 30px 80px -30px var(--accent-glow); }
      `}</style>
    </section>
  );
}
