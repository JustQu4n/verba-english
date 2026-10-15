import { useTranslations } from "next-intl";

const STEPS = ["step1", "step2", "step3"] as const;

export function HowItWorks() {
  const t = useTranslations("HowItWorks");
  return (
    <section id="cach-hoat-dong" className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
      <h2 className="display max-w-[16ch] text-balance text-4xl sm:text-5xl lg:text-6xl">{t("title")}</h2>
      <ol className="mt-14 grid gap-6 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step} className="relative flex flex-col gap-4 overflow-hidden rounded-3xl border p-7 pt-20">
            <span
              aria-hidden="true"
              className="display absolute -top-2 right-5 text-[8rem] leading-none text-transparent [-webkit-text-stroke:2px_var(--border)]"
            >
              {i + 1}
            </span>
            <h3 className="relative text-xl font-bold tracking-tight">{t(`${step}Title`)}</h3>
            <p className="relative leading-relaxed text-muted-foreground">{t(`${step}Body`)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
