import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";

import { LogoMark } from "./logo";

/** A black "practice card": a Vietnamese prompt, a wrong answer marked in red, then the structure and the points. */
export function WritingDemo() {
  const t = useTranslations("Demo");
  return (
    <figure
      aria-label={t("label")}
      className="w-full max-w-md rounded-3xl bg-inverse p-6 text-inverse-foreground shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] dark:ring-1 dark:ring-white/10 sm:p-7"
    >
      <div className="flex items-center justify-between gap-3">
        <LogoMark className="size-8 ring-0" />
        <p className="rounded-full border border-inverse-foreground/25 px-3 py-1 text-xs font-medium text-inverse-foreground/80">
          {t("tag")} / {t("level")}
        </p>
      </div>

      <p lang="vi" className="display mt-8 text-[1.75rem] text-balance sm:text-3xl">
        Cuối tuần trước, tôi đã đến nhà bà.
      </p>

      <p className="mt-8 text-xs font-medium text-inverse-foreground/60">{t("yourAnswer")}</p>
      <p lang="en" className="mt-1 text-lg/9 sm:text-xl/10">
        Last weekend I{" "}
        <span className="relative inline-block" style={{ "--d": "1.2s" } as CSSProperties}>
          <span className="lp-strike">have went</span>
          <span className="lp-fix" aria-hidden="true">
            went
          </span>
          <span className="sr-only"> ({t("fixedTo")}: went) </span>
        </span>{" "}
        to my grandma&apos;s house.
      </p>
      <p className="lp-reveal mt-1 font-hand text-2xl text-[color:var(--mark)]" style={{ "--d": "2.3s" } as CSSProperties}>
        {t("comment")}
      </p>

      <div className="lp-reveal mt-6 rounded-2xl bg-inverse-foreground/10 px-4 py-3" style={{ "--d": "3.2s" } as CSSProperties}>
        <p className="text-xs font-medium text-inverse-foreground/60">{t("structureLabel")}</p>
        <p className="mt-1 text-sm font-medium">{t("structure")}</p>
      </div>

      <div className="lp-reveal mt-4 flex items-center justify-between gap-3" style={{ "--d": "3.9s" } as CSSProperties}>
        <p className="inline-flex items-center gap-2 text-sm font-semibold">
          <span className="grid size-6 place-items-center rounded-full bg-inverse-foreground text-inverse">
            <Check className="size-4" aria-hidden="true" />
          </span>
          {t("correct")}
        </p>
        <p className="rounded-full bg-inverse-foreground px-3 py-1 text-sm font-bold text-inverse">{t("points")}</p>
      </div>
    </figure>
  );
}
