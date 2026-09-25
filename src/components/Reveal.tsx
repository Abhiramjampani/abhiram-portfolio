"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Fades up every element marked with `data-reveal` as it enters the viewport. */
export default function Reveal() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set("[data-reveal]", { autoAlpha: 0, y: 40 });
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 88%",
        once: true,
        onEnter: (els) =>
          gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.09 }),
      });
    });
    return () => ctx.revert();
  }, []);
  return null;
}
