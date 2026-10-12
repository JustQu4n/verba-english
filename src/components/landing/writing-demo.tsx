import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";

/** A word struck through in red, with the correction written above (like a teacher marking homework). */
function Fix({ wrong, right, delay }: { wrong: string; right: string; delay: string }) {
  const t = useTranslations("Demo");
  return (
    <span className="relative inline-block" style={{ "--d": delay } as CSSProperties}>
      <span className="pen-strike">{wrong}</span>
      <span className="pen-fix" aria-hidden="true">
        {right}
      </span>
      <span className="sr-only"> ({t("fixedTo")}: {right}) </span>
    </span>
  );
}

export function WritingDemo() {
  const t = useTranslations("Demo");
  return (
    <figure
      className="notebook w-full max-w-xl rounded-xl border border-rule shadow-[0_18px_40px_-24px_rgba(20,33,61,0.45)] -rotate-1"
      aria-label={t("label")}
    >
      <div className="relative z-10 pb-4 pl-[3.75rem] pr-4 sm:pl-[4.25rem] sm:pr-6">
        <p className="notebook-label text-sm font-medium text-muted-foreground">
          {t("prompt")}
        </p>
        {/* A single paragraph: text wraps naturally but always sits on the ruled lines (line-height = ruled line height). */}
        <p className="notebook-line">
          Last weekend I <Fix wrong="have went" right="went" delay="1.2s" /> to my grandma&apos;s
          house. We cooked a lot of <Fix wrong="foods" right="food" delay="2.6s" /> and talked
          until night.
        </p>
        <p className="notebook-line pen-note text-[1.45rem]" style={{ "--d": "3.4s" } as CSSProperties}>
          {t("comment")}
        </p>
      </div>
    </figure>
  );
}
