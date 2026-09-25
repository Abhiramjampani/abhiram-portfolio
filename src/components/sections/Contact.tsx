import { profile } from "@/data/content";
import { GitHub, LinkedIn, Mail, Scroll } from "../Icons";

export default function Contact() {
  return (
    <section id="contact" className="relative overflow-hidden px-5 py-32 md:px-10 md:py-48">
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 100%, var(--accent-glow), transparent 60%)", opacity: 0.5 }} />
      <div className="relative mx-auto max-w-3xl text-center">
        <div className="seal mx-auto mb-10 flex h-20 w-20 items-center justify-center rounded-full">
          <span className="font-display text-xl tracking-[0.12em] text-bg">AJ</span>
        </div>
        <p data-reveal className="eyebrow text-xl">Send a Raven</p>
        <h2 data-reveal className="font-display metal-text mt-3 text-4xl font-semibold tracking-[0.05em] md:text-6xl">
          Let&apos;s build something
        </h2>
        <p data-reveal className="mx-auto mt-6 max-w-xl leading-relaxed text-muted md:text-lg">
          Open to conversations on compilers, GPU systems, databases and interesting engineering problems.
        </p>
        <div data-reveal className="mt-12 flex flex-wrap justify-center gap-4">
          <a href={`mailto:${profile.email}`} className="btn btn-primary">
            <Mail className="h-4 w-4" /> Email Me
          </a>
          <a href={profile.resume} target="_blank" rel="noreferrer" className="btn btn-ghost">
            <Scroll className="h-4 w-4" /> Résumé
          </a>
        </div>
        <div data-reveal className="mt-10 flex justify-center gap-6">
          <a href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="text-muted transition-colors hover:text-accent">
            <LinkedIn className="h-5 w-5" />
          </a>
          <a href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub" className="text-muted transition-colors hover:text-accent">
            <GitHub className="h-5 w-5" />
          </a>
        </div>
      </div>

      <footer className="relative mx-auto mt-32 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-[var(--border)] pt-8 text-xs text-muted md:flex-row">
        <p>© {new Date().getFullYear()} Abhiram Jampani</p>
        <p className="font-serif italic">Built with Next.js, Three.js &amp; GSAP</p>
      </footer>

      <style>{`
        .seal { background: var(--metal); box-shadow: inset 0 0 0 4px color-mix(in srgb, var(--bg) 25%, transparent), inset 0 -6px 12px rgba(0,0,0,.35), 0 0 40px var(--accent-glow); animation: breathe 5s ease-in-out infinite; }
        @keyframes breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
      `}</style>
    </section>
  );
}
