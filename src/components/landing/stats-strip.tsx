import { useTranslations } from "next-intl";

const STATS = ["levels", "topics", "modes", "points"] as const;

/** A black band of facts about the product. */
export function StatsStrip() {
  const t = useTranslations("Stats");
  return (
    <section className="bg-inverse text-inverse-foreground">
      <dl className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-5 py-14 sm:px-8 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat}>
            <dt className="display text-6xl sm:text-7xl">{t(`${stat}Value`)}</dt>
            <dd className="mt-3 max-w-[22ch] text-sm leading-snug text-inverse-foreground/70">{t(`${stat}Label`)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
