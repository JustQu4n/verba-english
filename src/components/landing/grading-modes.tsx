import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/** The same two-way toggle as the practice screen, then what each way of checking gives you. */
function ModeToggle({ ai, reference, active }: { ai: string; reference: string; active: "ai" | "reference" }) {
  const item = (key: "ai" | "reference", label: string) => (
    <span
      className={cn(
        "rounded-full px-4 py-1.5 text-sm font-medium",
        active === key ? "bg-foreground text-background" : "text-muted-foreground"
      )}
    >
      {label}
    </span>
  );
  return (
    <span aria-hidden="true" className="inline-flex rounded-full border bg-muted p-1">
      {item("ai", ai)}
      {item("reference", reference)}
    </span>
  );
}

export function GradingModes() {
  const t = useTranslations("Modes");
  const cards = [
    { key: "ai", dark: false },
    { key: "ref", dark: true },
  ] as const;
  return (
    <section id="cach-cham" className="border-y bg-muted/60">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h2 className="display max-w-[14ch] text-balance text-4xl sm:text-5xl lg:text-6xl">{t("title")}</h2>
          <div className="flex flex-col items-start gap-4 lg:items-end">
            <p className="max-w-[44ch] leading-relaxed text-muted-foreground lg:text-right">{t("intro")}</p>
            <ModeToggle ai={t("aiTitle")} reference={t("refTitle")} active="ai" />
          </div>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {cards.map(({ key, dark }) => (
            <article
              key={key}
              className={cn("flex flex-col rounded-3xl border p-8", dark ? "border-inverse bg-inverse text-inverse-foreground dark:border-white/10" : "bg-background")}
            >
              <h3 className="display text-3xl sm:text-4xl">{t(`${key}Title`)}</h3>
              <p className={cn("mt-4 leading-relaxed", dark ? "text-inverse-foreground/75" : "text-muted-foreground")}>{t(`${key}Body`)}</p>
              <ul className="mt-8 space-y-3 border-t pt-6 text-sm font-medium" style={{ borderColor: dark ? "rgb(255 255 255 / 0.2)" : undefined }}>
                {[1, 2].map((n) => (
                  <li key={n} className="flex items-start gap-3">
                    <span
                      className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", dark ? "bg-inverse-foreground text-inverse" : "bg-foreground text-background")}
                    >
                      <Check className="size-3.5" aria-hidden="true" />
                    </span>
                    {t(`${key}Point${n}`)}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
