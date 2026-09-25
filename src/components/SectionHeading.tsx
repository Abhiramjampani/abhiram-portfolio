"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * `label` is the plain section name (for skimmers and recruiters);
 * `title` is its name in the world of Westeros, revealed letter by letter.
 */
export default function SectionHeading({
  label,
  title,
  intro,
  align = "center",
}: {
  label: string;
  title: string;
  intro?: string;
  align?: "center" | "left";
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 82%", once: true } });
      tl.from("[data-label]", { autoAlpha: 0, y: 12, letterSpacing: "0.6em", duration: 0.9, ease: "power3.out" })
        .from(
          "[data-char]",
          {
            autoAlpha: 0,
            yPercent: 70,
            rotateX: -85,
            filter: "blur(10px)",
            duration: 1.1,
            ease: "power4.out",
            stagger: 0.035,
          },
          "-=0.6",
        )
        .from("[data-rule]", { scaleX: 0, duration: 1.2, ease: "power3.inOut" }, "-=0.9");
      if (intro) tl.from("[data-intro]", { autoAlpha: 0, y: 16, duration: 0.9, ease: "power3.out" }, "-=0.8");
    }, root);
    return () => ctx.revert();
  }, [intro]);

  const words = title.split(" ");
  const offsets = words.map((_, wi) => words.slice(0, wi).join("").length);
  const centered = align === "center";

  return (
    <div ref={root} className={`mb-14 md:mb-20 ${centered ? "text-center" : ""}`}>
      <p data-label className="mb-4 text-[0.7rem] font-medium uppercase tracking-[0.42em] text-muted">
        <span className="text-accent">◆</span>&nbsp;&nbsp;{label}&nbsp;&nbsp;<span className="text-accent">◆</span>
      </p>
      <h2
        aria-label={title}
        className="font-display sheen text-4xl font-semibold leading-[1.1] tracking-[0.05em] md:text-6xl lg:text-7xl"
        style={{ perspective: "600px" }}
      >
        {words.map((w, wi) => (
          <span key={wi} aria-hidden className="inline-block whitespace-nowrap">
            {w.split("").map((ch, i) => (
              <span
                key={i}
                data-char
                className="inline-block"
                style={{ transformOrigin: "50% 100%", ["--i" as string]: offsets[wi] + i }}
              >
                {ch}
              </span>
            ))}
            {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
          </span>
        ))}
      </h2>
      <div data-rule className={`divider mt-7 max-w-sm ${centered ? "mx-auto" : ""}`}>
        <span className="text-[0.6rem]">◆</span>
      </div>
      {intro && (
        <p data-intro className={`mt-7 max-w-2xl leading-relaxed text-muted md:text-lg ${centered ? "mx-auto" : ""}`}>
          {intro}
        </p>
      )}
    </div>
  );
}
