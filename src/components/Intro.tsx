"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useHouse } from "@/lib/house";

const NAME = "ABHIRAM JAMPANI";
const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

// Wind strength for the intro weather; the timeline gusts it as the house words land.
const wind = { gust: 0 };

declare global {
  interface Window {
    __introDone?: boolean;
  }
}

/** Signals the hero to begin its entrance. */
function releaseHero() {
  if (window.__introDone) return;
  window.__introDone = true;
  window.dispatchEvent(new Event("intro-done"));
}

/**
 * Opening title sequence: a spinning astrolabe in the snow (or embers),
 * the name forged letter by letter, the house words — then the gates open.
 * The full sequence plays once per session; later loads just open the gates.
 */
export default function Intro() {
  const { house } = useHouse();
  const root = useRef<HTMLDivElement>(null);
  const weather = useRef<HTMLCanvasElement>(null);
  const [gone, setGone] = useState(false);
  const skip = useRef<() => void>(() => {});
  // Decided once per mount (effects may run twice in development).
  const seenBefore = useRef<boolean | null>(null);

  // Title timeline
  useEffect(() => {
    const el = root.current!;
    if (seenBefore.current === null) {
      seenBefore.current = sessionStorage.getItem("intro-seen") === "1";
      sessionStorage.setItem("intro-seen", "1");
    }
    const seen = seenBefore.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.style.overflow = "hidden";

    const finish = () => {
      document.documentElement.style.overflow = "";
      releaseHero();
      setGone(true);
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: finish });
      if (reduced) {
        tl.to(el, { autoAlpha: 0, duration: 0.4 });
        return;
      }
      if (!seen) {
        tl.to("[data-astro]", { autoAlpha: 1, scale: 1, rotate: 0, duration: 2.4, ease: "power2.out" }, 0)
          .to("[data-glow]", { autoAlpha: 1, duration: 2, ease: "power1.out" }, 0.3)
          .to(
            "[data-ichar]",
            { autoAlpha: 1, filter: "blur(0px)", y: 0, scale: 1, duration: 1.3, stagger: 0.055, ease: "power3.out" },
            0.7,
          )
          .to("[data-irole]", { autoAlpha: 1, letterSpacing: "0.42em", duration: 1.4, ease: "power3.out" }, 1.55)
          .to("[data-iline]", { scaleX: 1, duration: 1.2, ease: "power3.inOut" }, 1.8)
          .to(
            "[data-iword]",
            { autoAlpha: 1, filter: "blur(0px)", y: 0, duration: 0.9, stagger: 0.05, ease: "power2.out" },
            2.3,
          )
          .to("[data-iwords]", { filter: "brightness(1.6)", duration: 0.55, yoyo: true, repeat: 1, ease: "sine.inOut" }, 3.2)
          .to(wind, { gust: 1, duration: 0.5, ease: "power2.out" }, 2.2)
          .to(wind, { gust: 0, duration: 1.8, ease: "power2.inOut" }, 2.8)
          .addLabel("open", 4.6);
      } else {
        tl.set("[data-istage]", { autoAlpha: 0 }).addLabel("open", 0.15);
      }

      tl.to("[data-istage]", { scale: 1.35, autoAlpha: 0, filter: "blur(8px)", duration: 1.1, ease: "power3.in" }, "open")
        .to("[data-skip]", { autoAlpha: 0, duration: 0.3 }, "open")
        .to("[data-gate='l']", { xPercent: -101, duration: 1.5, ease: "power4.inOut" }, "open+=0.45")
        .to("[data-gate='r']", { xPercent: 101, duration: 1.5, ease: "power4.inOut" }, "open+=0.45")
        .to("[data-seam]", { autoAlpha: 1, scaleY: 1, duration: 0.45, ease: "power2.out" }, "open+=0.1")
        .to("[data-seam]", { autoAlpha: 0, duration: 0.4 }, "open+=0.6")
        .to(weather.current, { autoAlpha: 0, duration: 1 }, "open+=0.6")
        .call(releaseHero, [], "open+=0.9");

      skip.current = () => {
        if (tl.time() < tl.labels.open) tl.seek("open");
      };
    }, el);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") skip.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      ctx.revert();
      document.documentElement.style.overflow = "";
    };
  }, []);

  // Weather: wind-driven snow, or rising embers.
  useEffect(() => {
    const c = weather.current;
    if (!c) return;
    const g = c.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const resize = () => {
      c.width = window.innerWidth * dpr;
      c.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);
    const ps = Array.from({ length: window.innerWidth < 700 ? 140 : 320 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.3 + Math.random() * 0.7,
      p: Math.random() * Math.PI * 2,
    }));
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const fire = document.documentElement.dataset.theme === "targaryen";
      const W = c.width;
      const H = c.height;
      g.clearRect(0, 0, W, H);
      for (const q of ps) {
        const gust = wind.gust;
        if (fire) {
          q.y -= dt * (0.12 + gust * 0.25) * q.z;
          q.x += Math.sin(now * 0.0012 + q.p) * dt * 0.02 + gust * dt * 0.2 * q.z;
        } else {
          q.y += dt * (0.09 + gust * 0.12) * q.z;
          q.x += dt * (0.05 + gust * 0.45) * q.z + Math.sin(now * 0.0008 + q.p) * dt * 0.015;
        }
        if (q.y > 1.02) q.y = -0.02;
        if (q.y < -0.02) q.y = 1.02;
        if (q.x > 1.02) q.x = -0.02;
        const r = (fire ? 1.4 : 1.1 + q.z * 1.8) * dpr * q.z;
        const a = fire ? (0.45 + 0.55 * Math.sin(now * 0.006 + q.p * 9)) * q.z : 0.35 + 0.55 * q.z;
        const color = fire ? `rgba(255,${130 + Math.round(60 * q.z)},50,${a})` : `rgba(230,242,255,${a})`;
        g.shadowBlur = fire ? 10 * dpr : 0;
        g.shadowColor = "rgba(255,110,30,0.9)";
        if (!fire && gust > 0.2 && q.z > 0.8) {
          // In the gust, the nearest flakes smear into short streaks.
          const len = gust * 22 * q.z * dpr;
          g.strokeStyle = color;
          g.lineWidth = r;
          g.lineCap = "round";
          g.beginPath();
          g.moveTo(q.x * W, q.y * H);
          g.lineTo(q.x * W - len, q.y * H - len * 0.25);
          g.stroke();
        } else {
          g.beginPath();
          g.arc(q.x * W, q.y * H, r, 0, Math.PI * 2);
          g.fillStyle = color;
          g.fill();
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  if (gone) return null;

  const words = house === "stark" ? "Winter is Coming" : "Fire and Blood";

  return (
    <div ref={root} className="intro fixed inset-0 z-[100] overflow-hidden" onClick={() => skip.current()}>
      {/* The gates */}
      <div data-gate="l" className="gate gate-l" />
      <div data-gate="r" className="gate gate-r" />
      <div data-seam className="gate-seam" />

      <canvas ref={weather} className="pointer-events-none absolute inset-0 h-full w-full" />

      <div data-istage className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <div data-glow className="intro-glow" />

        {/* Astrolabe */}
        <div className="astro-wrap">
        <div data-astro className="astro">
          <div className="astro-body">
            <div className="ring ring-outer">
              {NUMERALS.map((n, i) => (
                <span
                  key={n}
                  className="numeral"
                  style={{ transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(calc(var(--R) * -1))` }}
                >
                  {n}
                </span>
              ))}
            </div>
            <div className="ring ring-a" />
            <div className="ring ring-b" />
            <div className="ring ring-c" />
            <div className="ring ring-d" />
            <div className="astro-core" />
          </div>
        </div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <h1 aria-label="Abhiram Jampani" className="font-display text-[11vw] font-semibold leading-none tracking-[0.1em] sm:text-7xl md:text-8xl">
            {NAME.split(" ").map((word, wi, all) => {
              const offset = all.slice(0, wi).join("").length;
              return (
                // Words never break internally; the line may wrap between them.
                <span key={wi} className="inline-block whitespace-nowrap">
                  {word.split("").map((ch, i) => (
                    <span key={i} data-ichar className="ichar sheen-char" aria-hidden style={{ ["--i" as string]: offset + i }}>
                      {ch}
                    </span>
                  ))}
                  {wi < all.length - 1 && <span className="inline-block w-[0.4em]" />}
                </span>
              );
            })}
          </h1>
          <p data-irole className="irole mt-12 text-[0.7rem] uppercase text-muted md:text-sm">
            Compiler Engineer&nbsp;·&nbsp;NVIDIA
          </p>
          <div data-iline className="iline mt-8" />
          <p data-iwords className="iwords font-display mt-7 text-2xl tracking-[0.28em] md:text-4xl" suppressHydrationWarning>
            {words.split("").map((ch, i) => (
              // Index keys keep DOM nodes stable if the house resolves after hydration.
              <span key={i} data-iword className="iword">
                {ch === " " ? "\u00a0" : ch}
              </span>
            ))}
          </p>
        </div>
      </div>

      <button
        data-skip
        onClick={(e) => {
          e.stopPropagation();
          skip.current();
        }}
        className="absolute bottom-7 right-7 z-20 text-[0.65rem] uppercase tracking-[0.35em] text-muted transition-colors hover:text-text"
      >
        Skip intro ›
      </button>
    </div>
  );
}
