"use client";

import { useCallback, useSyncExternalStore } from "react";

export type House = "stark" | "targaryen";

const EVENT = "house-change";

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

function getSnapshot(): House {
  return document.documentElement.dataset.theme === "targaryen" ? "targaryen" : "stark";
}

function getServerSnapshot(): House {
  return "stark";
}

function apply(next: House) {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("house", next);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function useHouse() {
  const house = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Circular reveal from the click point using the View Transitions API when available.
  const toggle = useCallback((e?: { clientX: number; clientY: number }) => {
    const next: House = getSnapshot() === "stark" ? "targaryen" : "stark";
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };
    if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply(next);
      return;
    }
    const x = e?.clientX ?? window.innerWidth - 60;
    const y = e?.clientY ?? 40;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const t = doc.startViewTransition(() => apply(next));
    t.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 900, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    });
  }, []);

  return { house, toggle };
}
