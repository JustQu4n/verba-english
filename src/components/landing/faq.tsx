import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

const QUESTIONS = [1, 2, 3, 4, 5] as const;

/** Native disclosure elements: keyboard and screen reader friendly with no script. */
export function Faq() {
  const t = useTranslations("Faq");
  return (
    <section id="hoi-dap" className="border-t bg-muted/60">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-28">
        <h2 className="display max-w-[10ch] text-balance text-4xl sm:text-5xl lg:text-6xl">{t("title")}</h2>
        <div className="divide-y border-y">
          {QUESTIONS.map((n) => (
            <details key={n} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold tracking-tight [&::-webkit-details-marker]:hidden">
                {t(`q${n}`)}
                <Plus className="size-5 shrink-0 transition-transform group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true" />
              </summary>
              <p className="mt-3 max-w-[56ch] leading-relaxed text-muted-foreground">{t(`a${n}`)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
