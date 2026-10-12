import { useTranslations } from "next-intl";

const STEPS = ["step1", "step2", "step3"] as const;

export function HowItWorks() {
  const t = useTranslations("HowItWorks");
  return (
    <section id="cach-hoat-dong" className="border-y border-rule bg-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
        <h2 className="max-w-[24ch] text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, i) => (
            <li key={step} className="flex gap-5 md:flex-col md:gap-3">
              <span
                aria-hidden="true"
                className="font-hand text-6xl font-bold leading-none text-pen md:text-7xl"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="text-xl font-semibold">{t(`${step}Title`)}</h3>
                <p className="mt-2 max-w-[38ch] leading-relaxed text-muted-foreground">{t(`${step}Body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
