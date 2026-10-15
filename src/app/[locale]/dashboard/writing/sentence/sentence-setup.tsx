"use client";

import { ArrowLeft, ArrowRight, History } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { CATEGORIES, LEVELS, type Category, type Level } from "@/modules/writing/domain/sentence-catalog";
import type { LevelProgress } from "@/modules/writing/domain/sentence-progress";

import { CategoryProgress } from "./category-progress";
import { CATEGORY_ICONS } from "./category-icons";
import { ChoiceCard } from "./choice-card";

interface SentenceSetupProps {
  level: Level | null;
  category: Category | null;
  onLevelChange: (level: Level) => void;
  onCategoryChange: (category: Category) => void;
  onStart: () => void;
  starting: boolean;
  /** Progress of every category in the chosen level; null until it has been loaded. */
  progress: LevelProgress | null;
  error: "unauthorized" | "not_found" | "unknown" | null;
}

/** Three bars that fill up with difficulty. They inherit the text color, so they invert with the card. */
function LevelMeter({ rank }: { rank: number }) {
  return (
    <span className="flex gap-1" aria-hidden="true">
      {LEVELS.map((l, index) => (
        <span key={l} className={`h-1.5 w-6 rounded-full bg-current ${index < rank ? "" : "opacity-25"}`} />
      ))}
    </span>
  );
}

/** Step before practising: pick a level and a category, then start. */
export function SentenceSetup({
  level,
  category,
  onLevelChange,
  onCategoryChange,
  onStart,
  starting,
  progress,
  error,
}: SentenceSetupProps) {
  const t = useTranslations("Sentence");
  const ready = level !== null && category !== null;
  const pairProgress = category && progress ? progress[category] : null;

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-5 pt-8 pb-8 sm:px-8 sm:pt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t("back")}
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/writing/sentence/history">
              <History aria-hidden="true" />
              {t("history.link")}
            </Link>
          </Button>
        </div>
        <h1 className="mt-6 text-5xl font-extrabold tracking-tighter italic sm:text-6xl">{t("title")}</h1>
        <p className="mt-3 max-w-xl text-lg text-muted-foreground">{t("intro")}</p>

        <section aria-labelledby="level-heading" className="mt-12">
          <h2 id="level-heading" className="text-xl font-semibold tracking-tight">
            {t("levelHeading")}
          </h2>
          <div role="radiogroup" aria-labelledby="level-heading" className="mt-5 grid gap-3 sm:grid-cols-3">
            {LEVELS.map((l, index) => (
              <ChoiceCard
                key={l}
                name="level"
                value={l}
                checked={level === l}
                onSelect={() => onLevelChange(l)}
                className="flex-col gap-4 p-5"
              >
                <LevelMeter rank={index + 1} />
                <span className="flex flex-col gap-1.5">
                  <span className="text-lg font-semibold tracking-tight">{t(`levels.${l}.name`)}</span>
                  <span className={`text-sm/relaxed ${level === l ? "text-background/75" : "text-muted-foreground"}`}>
                    {t(`levels.${l}.description`)}
                  </span>
                </span>
              </ChoiceCard>
            ))}
          </div>
        </section>

        <section aria-labelledby="category-heading" className="mt-12">
          <h2 id="category-heading" className="text-xl font-semibold tracking-tight">
            {t("categoryHeading")}
          </h2>
          <div
            role="radiogroup"
            aria-labelledby="category-heading"
            className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          >
            {CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICONS[c];
              const done = progress?.[c];
              return (
                <ChoiceCard
                  key={c}
                  name="category"
                  value={c}
                  checked={category === c}
                  onSelect={() => onCategoryChange(c)}
                  className="min-h-28 flex-col items-start justify-between gap-4 p-4"
                >
                  <Icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
                  <span className="flex w-full flex-col gap-2">
                    <span className="text-sm leading-snug font-semibold">{t(`categories.${c}`)}</span>
                    {level ? (
                      <CategoryProgress key={`${level}-${c}`} label={`${t(`categories.${c}`)}: ${t("progressLabel")}`} progress={done ?? null} />
                    ) : (
                      // No level yet: keep the line's height so the card does not grow once a level is picked.
                      <span aria-hidden="true" className="block h-4" />
                    )}
                  </span>
                </ChoiceCard>
              );
            })}
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 z-20 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <p className="min-w-0 truncate text-sm text-muted-foreground" aria-live="polite">
            {ready ? (
              <>
                <span className="font-semibold text-foreground">{t(`categories.${category}`)}</span>
                {" · "}
                {t(`levels.${level}.name`)}
                {pairProgress && (
                  <>
                    {" · "}
                    {t("progressDone", { completed: pairProgress.completed, total: pairProgress.total })}
                  </>
                )}
              </>
            ) : (
              t("chooseBoth")
            )}
          </p>
          {error && (
            <p role="alert" className="hidden text-sm font-medium text-destructive sm:block">
              {t(`errors.${error}`)}
            </p>
          )}
          <Button size="lg" disabled={!ready || starting} onClick={onStart}>
            {t("start")}
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </>
  );
}
