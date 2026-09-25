import { education } from "@/data/content";
import SectionHeading from "../SectionHeading";

export default function Education() {
  return (
    <section id="education" className="relative isolate mx-auto max-w-6xl px-5 py-24 md:px-10 md:py-32">
      <div className="fog-band" aria-hidden />
      <SectionHeading label="Education" title="The Citadel" intro="Where every maester forges the first links of the chain." />
      <article data-reveal className="panel relative mx-auto max-w-4xl overflow-hidden p-8 md:p-12">
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full opacity-20 blur-3xl" style={{ background: "var(--accent)" }} />
        <div className="grid gap-8 md:grid-cols-[auto_1fr] md:gap-12">
          <div className="links flex items-center gap-1.5 md:flex-col md:justify-center" aria-hidden>
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="block h-5 w-3 rounded-full border-2" style={{ borderColor: "var(--accent)", opacity: 0.35 + i * 0.12 }} />
            ))}
          </div>
          <div>
            <p className="font-display text-sm tracking-[0.25em] text-accent">{education.period}</p>
            <h3 className="font-display mt-3 text-2xl leading-snug tracking-[0.04em] md:text-3xl">{education.school}</h3>
            <p className="eyebrow mt-2 text-xl">{education.degree}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {education.coursework.map((c) => (
                <span key={c} className="chip">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
