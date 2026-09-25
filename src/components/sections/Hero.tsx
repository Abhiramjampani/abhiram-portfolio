"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { profile } from "@/data/content";
import { useHouse } from "@/lib/house";

gsap.registerPlugin(ScrollTrigger);

const HeroScene = dynamic(() => import("../three/HeroScene"), { ssr: false });

export default function Hero() {
  const { house } = useHouse();
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-hero]", {
        y: 50,
        autoAlpha: 0,
        duration: 1.3,
        ease: "power3.out",
        stagger: 0.12,
        delay: 2.1, // lands just as the loader lifts
      });
      // Content drifts up and fades as you scroll into the page.
      gsap.to("[data-hero-content]", {
        yPercent: -25,
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to("[data-hero-scene]", {
        scale: 1.15,
        autoAlpha: 0.2,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative h-[100svh] min-h-[640px] overflow-hidden">
      <div className="pointer-events-none absolute inset-0" style={{ background: "var(--vignette)" }} />
      <div data-hero-scene className="absolute inset-0">
        <HeroScene house={house} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />

      <div
        data-hero-content
        className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-24 md:justify-center md:px-10 md:pb-0"
      >
        <div className="max-w-2xl">
          <p data-hero className="eyebrow mb-5 text-lg md:text-xl">
            {profile.role} · {profile.company}
          </p>
          <h1
            data-hero
            className="font-display metal-text text-5xl font-semibold leading-[1.05] tracking-[0.04em] sm:text-6xl md:text-7xl lg:text-8xl"
          >
            Abhiram
            <br />
            Jampani
          </h1>
          <p data-hero className="mt-7 max-w-xl text-base leading-relaxed text-muted md:text-lg">
            {profile.tagline}
          </p>
          <div data-hero className="mt-10 flex flex-wrap gap-4">
            <a href="#experience" className="btn btn-primary pointer-events-auto">
              View Experience
            </a>
            <a href={profile.resume} target="_blank" rel="noreferrer" className="btn btn-ghost pointer-events-auto">
              Résumé
            </a>
          </div>
        </div>
      </div>

      <div data-hero className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex">
        <span className="text-[0.62rem] uppercase tracking-[0.35em] text-muted">Scroll</span>
        <span className="h-10 w-px animate-pulse bg-gradient-to-b from-accent to-transparent" />
      </div>
    </section>
  );
}
