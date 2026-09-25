import { about } from "@/data/content";
import SectionHeading from "../SectionHeading";

export default function About() {
  return (
    <section id="about" className="relative isolate mx-auto max-w-6xl px-5 py-24 md:px-10 md:py-32">
      <div className="fog-band" aria-hidden />
      <SectionHeading label="About" title="The Maester's Chronicle" />
      <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:gap-16">
        <div className="space-y-6">
          {about.paragraphs.map((p, i) => (
            <p
              key={i}
              data-reveal
              className={`leading-relaxed ${i === 0 ? "font-serif text-2xl text-text md:text-3xl" : "text-muted md:text-lg"}`}
            >
              {p}
            </p>
          ))}
        </div>
        <dl data-reveal className="panel self-start divide-y divide-[var(--border)] p-2">
          {about.facts.map((f) => (
            <div key={f.label} className="flex items-baseline justify-between gap-6 px-5 py-4">
              <dt className="text-[0.68rem] uppercase tracking-[0.22em] text-muted">{f.label}</dt>
              <dd className="text-right text-sm text-text">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
