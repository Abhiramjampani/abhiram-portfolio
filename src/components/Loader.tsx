"use client";

import { useEffect, useState } from "react";
import { useHouse } from "@/lib/house";

/** Short intro: a wax seal with the monogram, then the house words. */
export default function Loader() {
  const { house } = useHouse();
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    const t1 = setTimeout(() => setPhase("out"), 1900);
    const t2 = setTimeout(() => {
      setPhase("gone");
      document.documentElement.style.overflow = "";
    }, 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg transition-all duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)] ${
        phase === "out" ? "opacity-0 scale-105 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full">
          <circle cx="60" cy="60" r="54" fill="none" stroke="var(--accent)" strokeWidth="1" className="seal-ring" />
          <circle cx="60" cy="60" r="46" fill="none" stroke="var(--border-strong)" strokeWidth="0.6" strokeDasharray="2 4" className="seal-dots" />
        </svg>
        <span className="seal-mono font-display metal-text absolute inset-0 flex items-center justify-center text-4xl tracking-[0.15em]">
          AJ
        </span>
      </div>
      <p className="seal-words eyebrow mt-8 text-xl" suppressHydrationWarning>
        {house === "stark" ? "Winter is Coming" : "Fire and Blood"}
      </p>
      <style>{`
        .seal-ring { stroke-dasharray: 340; stroke-dashoffset: 340; animation: draw 1.4s cubic-bezier(.65,0,.35,1) forwards; }
        .seal-dots { transform-origin: 60px 60px; animation: spin 8s linear infinite; opacity: 0; animation: spin 8s linear infinite, fade .6s .5s forwards; }
        .seal-mono { opacity: 0; transform: scale(1.4); animation: stamp .7s .6s cubic-bezier(.2,.8,.2,1) forwards; }
        .seal-words { opacity: 0; letter-spacing: .5em; animation: words 1s 1s ease forwards; }
        @keyframes draw { to { stroke-dashoffset: 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fade { to { opacity: 1; } }
        @keyframes stamp { to { opacity: 1; transform: scale(1); } }
        @keyframes words { to { opacity: 1; letter-spacing: .12em; } }
      `}</style>
    </div>
  );
}
