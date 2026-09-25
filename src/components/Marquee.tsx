"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const WORDS = ["Winter is Coming", "Fire and Blood", "The North Remembers", "Dracarys", "Valar Morghulis", "Valar Dohaeris"];

/** Giant engraved house words that glide sideways as you scroll. */
export default function Marquee({ reverse = false }: { reverse?: boolean }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-track]",
        { xPercent: reverse ? -30 : 0 },
        {
          xPercent: reverse ? 0 : -30,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.8 },
        },
      );
    }, root);
    return () => ctx.revert();
  }, [reverse]);

  const row = [...WORDS, ...WORDS];
  return (
    <div ref={root} aria-hidden className="relative overflow-hidden border-y border-[var(--border)] py-6 md:py-9">
      <div data-track className="flex w-max items-center gap-10 whitespace-nowrap md:gap-16">
        {row.map((w, i) => (
          <span key={i} className="flex items-center gap-10 md:gap-16">
            <span className={`font-display text-4xl tracking-[0.08em] md:text-7xl ${i % 2 ? "outline-text" : "text-[color-mix(in_srgb,var(--text)_12%,transparent)]"}`}>
              {w}
            </span>
            <span className="text-lg text-accent md:text-2xl">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
