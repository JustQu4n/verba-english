import { useTranslations } from "next-intl";

const FEATURES = ["grammar", "natural", "level", "memory"] as const;

export function Features() {
  const t = useTranslations("Features");
  return (
    <section id="tinh-nang" className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <h2 className="max-w-[20ch] text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
        <dl className="border-t border-rule">
          {FEATURES.map((f) => (
            <div key={f} className="grid gap-1 border-b border-rule py-6 sm:grid-cols-[1fr_1.4fr] sm:gap-8">
              <dt className="text-lg font-semibold">{t(`${f}Title`)}</dt>
              <dd className="leading-relaxed text-muted-foreground">{t(`${f}Body`)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
