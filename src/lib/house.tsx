"use client";

import { useCallback, useSyncExternalStore } from "react";

export type House = "stark" | "targaryen";

const EVENT = "house-change";
export const TRANSITION_EVENT = "house-transition";

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export function getHouse(): House {
  return document.documentElement.dataset.theme === "targaryen" ? "targaryen" : "stark";
}

function getServerSnapshot(): House {
  return "stark";
}

/** Switches the theme immediately. The cinematic overlay calls this at its peak. */
export function applyHouse(next: House) {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("house", next);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function useHouse() {
  const house = useSyncExternalStore(subscribe, getHouse, getServerSnapshot);

  // Stark → Targaryen plays the dragon flight; Targaryen → Stark plays the winter storm.
  // ThemeTransition listens for this event and applies the theme mid-animation.
  const toggle = useCallback(() => {
    const next: House = getHouse() === "stark" ? "targaryen" : "stark";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      applyHouse(next);
      return;
    }
    window.dispatchEvent(new CustomEvent(TRANSITION_EVENT, { detail: { next } }));
  }, []);

  return { house, toggle };
}
