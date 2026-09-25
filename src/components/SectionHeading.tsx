export default function SectionHeading({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="mb-14 md:mb-20 text-center" data-reveal>
      <p className="eyebrow text-lg md:text-xl mb-3">{eyebrow}</p>
      <h2 className="font-display metal-text text-4xl md:text-6xl font-semibold tracking-[0.06em]">{title}</h2>
      <div className="divider mx-auto mt-6 max-w-xs">
        <span className="text-xs">◆</span>
      </div>
      {intro && <p className="mx-auto mt-6 max-w-2xl text-muted leading-relaxed">{intro}</p>}
    </div>
  );
}
