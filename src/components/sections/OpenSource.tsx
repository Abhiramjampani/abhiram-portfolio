import { openSource } from "@/data/content";
import SectionHeading from "../SectionHeading";
import { Arrow, GitHub } from "../Icons";

export default function OpenSource() {
  return (
    <section id="open-source" className="relative isolate mx-auto max-w-6xl px-5 py-24 md:px-10 md:py-32">
      <div className="fog-band" aria-hidden />
      <SectionHeading
        label="Open Source"
        title="The White Book"
        intro="Every deed of the Kingsguard is recorded in the White Book. Mine are recorded in commit history — contributions to infrastructure other engineers build on."
      />
      <div className="grid gap-6 md:grid-cols-3">
        {openSource.map((o) => (
          <a
            key={o.name}
            href={o.href}
            target="_blank"
            rel="noreferrer"
            data-reveal
            className="panel group flex flex-col p-7 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <GitHub className="h-6 w-6 text-muted transition-colors group-hover:text-accent" />
              <Arrow className="h-4 w-4 text-muted transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />
            </div>
            <h3 className="font-display mt-8 text-2xl tracking-[0.06em]">{o.name}</h3>
            <p className="mt-1 text-[0.65rem] uppercase tracking-[0.22em] text-accent">{o.tag}</p>
            <p className="mt-4 text-sm leading-relaxed text-muted">{o.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
