"use client";

import { useEffect, useRef } from "react";
import { applyHouse, TRANSITION_EVENT, type House } from "@/lib/house";
import { dragonFlight, winterStorm } from "@/lib/transitions";

/** Full-screen overlay that plays the dragon (→ Targaryen) or winter (→ Stark) transition. */
export default function ThemeTransition() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const busy = useRef(false);

  useEffect(() => {
    const onStart = (e: Event) => {
      const c = canvas.current;
      if (busy.current || !c) return;
      const next = (e as CustomEvent<{ next: House }>).detail.next;
      busy.current = true;
      c.style.display = "block";
      const play = next === "targaryen" ? dragonFlight : winterStorm;
      play(c, () => applyHouse(next)).finally(() => {
        c.style.display = "none";
        busy.current = false;
      });
    };
    window.addEventListener(TRANSITION_EVENT, onStart);
    return () => window.removeEventListener(TRANSITION_EVENT, onStart);
  }, []);

  return (
    <canvas
      ref={canvas}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[150] h-full w-full"
      style={{ display: "none" }}
    />
  );
}
