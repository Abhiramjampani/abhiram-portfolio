"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { competitive, leadership } from "@/data/content";
import SectionHeading from "../SectionHeading";
import { Arrow } from "../Icons";

gsap.registerPlugin(ScrollTrigger);

const MAX = 2400;

export default function Competitive() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number(el.dataset.count);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 2,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
          onUpdate: () => (el.textContent = Math.round(obj.v).toString()),
        });
      });
      gsap.utils.toArray<SVGCircleElement>("[data-ring]").forEach((el) => {
        gsap.fromTo(
          el,
          { strokeDashoffset: 302 },
          {
            strokeDashoffset: 302 * (1 - Number(el.dataset.ring)),
            duration: 2,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          },
        );
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative mx-auto max-w-6xl px-5 py-24 md:px-10 md:py-32">
      <SectionHeading eyebrow="The Tourney" title="Competitive Programming" />
      <div className="grid gap-6 md:grid-cols-3">
        {competitive.map((c) => (
          <a key={c.platform} href={c.href} target="_blank" rel="noreferrer" data-reveal className="panel group flex flex-col items-center p-8 text-center hover:-translate-y-1">
            <div className="relative h-28 w-28">
              <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90">
                <circle cx="55" cy="55" r="48" fill="none" stroke="var(--border)" strokeWidth="3" />
                <circle
                  data-ring={c.rating / MAX}
                  cx="55"
                  cy="55"
                  r="48"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="302"
                  strokeDashoffset="302"
                  style={{ filter: "drop-shadow(0 0 6px var(--accent-glow))" }}
                />
              </svg>
              <span data-count={c.rating} className="font-display absolute inset-0 flex items-center justify-center text-2xl text-text">
                {c.rating}
              </span>
            </div>
            <h3 className="font-display mt-6 text-xl tracking-[0.08em]">{c.platform}</h3>
            <p className="eyebrow mt-1 text-lg">{c.title}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-muted transition-colors group-hover:text-accent">
              Profile <Arrow className="h-3 w-3" />
            </span>
          </a>
        ))}
      </div>

      <div className="mt-24 md:mt-32">
        <SectionHeading eyebrow="Hand of the Fest" title="Leadership & Honours" />
        <div className="grid gap-6 md:grid-cols-2">
          {leadership.map((l) => (
            <div key={l.title} data-reveal className="panel p-8">
              <h3 className="font-display text-xl tracking-[0.05em]">{l.title}</h3>
              <p className="eyebrow mt-1 text-lg">{l.org}</p>
              <p className="mt-4 text-muted">{l.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
