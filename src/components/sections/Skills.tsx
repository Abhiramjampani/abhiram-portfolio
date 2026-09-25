import { skills } from "@/data/content";
import SectionHeading from "../SectionHeading";

export default function Skills() {
  return (
    <section id="skills" className="relative mx-auto max-w-6xl px-5 py-24 md:px-10 md:py-32">
      <SectionHeading eyebrow="The Armory" title="Technical Arsenal" />
      <div className="grid gap-6 sm:grid-cols-2">
        {skills.map((s) => (
          <div key={s.group} data-reveal className="panel p-7">
            <h3 className="font-display text-sm tracking-[0.25em] text-accent uppercase">{s.group}</h3>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {s.items.map((it) => (
                <span
                  key={it}
                  className="rounded-lg border border-[var(--border)] bg-white/[0.02] px-3.5 py-2 text-sm text-text transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
                >
                  {it}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
