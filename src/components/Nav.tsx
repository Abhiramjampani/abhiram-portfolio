"use client";

import { useEffect, useState } from "react";
import { useHouse } from "@/lib/house";
import { Flame, Snowflake } from "./Icons";

const links = [
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#education", label: "Education" },
  { href: "#open-source", label: "Open Source" },
  { href: "#projects", label: "Projects" },
  { href: "#skills", label: "Skills" },
  { href: "#contact", label: "Contact" },
];

export default function Nav() {
  const { house, toggle } = useHouse();
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(window.scrollY > 40);
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "backdrop-blur-xl bg-[color-mix(in_srgb,var(--bg)_70%,transparent)] border-b border-[var(--border)]" : ""
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-10">
        <a href="#" className="font-display text-lg tracking-[0.3em] text-text" aria-label="Home">
          A<span className="text-accent">·</span>J
        </a>

        <ul className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="group relative text-[0.72rem] uppercase tracking-[0.22em] text-muted transition-colors hover:text-text"
              >
                {l.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        <button
          onClick={(e) => toggle(e)}
          aria-label={`Switch to House ${house === "stark" ? "Targaryen" : "Stark"}`}
          className="group flex items-center gap-2.5 rounded-full border border-[var(--border-strong)] px-3.5 py-1.5 text-[0.68rem] uppercase tracking-[0.2em] text-muted transition-colors hover:text-text"
        >
          <span className="relative h-4 w-4">
            <Snowflake
              className={`absolute inset-0 h-4 w-4 text-accent transition-all duration-500 ${house === "stark" ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"}`}
            />
            <Flame
              className={`absolute inset-0 h-4 w-4 text-accent-2 transition-all duration-500 ${house === "targaryen" ? "opacity-100 rotate-0" : "opacity-0 rotate-90"}`}
            />
          </span>
          <span suppressHydrationWarning>{house === "stark" ? "Stark" : "Targaryen"}</span>
        </button>
      </nav>
      <div
        className="absolute bottom-0 left-0 h-px bg-accent"
        style={{ width: `${progress * 100}%`, boxShadow: "0 0 10px var(--accent-glow)" }}
      />
    </header>
  );
}
