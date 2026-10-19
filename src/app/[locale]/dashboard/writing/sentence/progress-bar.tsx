import { useTranslations } from "next-intl";

import { progressPercent, type SentenceProgress } from "@/modules/writing/domain/sentence-progress";

/** Sentences completed in the chosen level and category. */
export function ProgressBar({ progress }: { progress: SentenceProgress }) {
  const t = useTranslations("Sentence");
  const percent = progressPercent(progress);
  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <p className="font-medium">{t("progressDone", { completed: progress.completed, total: progress.total })}</p>
        <p className="tabular-nums text-muted-foreground">{percent}%</p>
      </div>
      <div
        role="progressbar"
        aria-label={t("progressLabel")}
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-valuenow={progress.completed}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-solid transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
