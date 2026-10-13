"use client";

import { ArrowLeft, PartyPopper } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { Category, Level } from "@/modules/writing/domain/sentence-catalog";
import type { SentenceProgress } from "@/modules/writing/domain/sentence-progress";

import { Fireworks } from "./fireworks";
import { ProgressBar } from "./progress-bar";

interface SentenceDoneProps {
  level: Level;
  category: Category;
  progress: SentenceProgress;
  /** Launch the fireworks: the pair was finished just now. */
  celebrate: boolean;
  onBack: () => void;
}

/** Shown when the learner has completed every sentence of the chosen level and category. */
export function SentenceDone({ level, category, progress, celebrate, onBack }: SentenceDoneProps) {
  const t = useTranslations("Sentence");
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      {celebrate && <Fireworks />}
      <PartyPopper className="size-10" strokeWidth={1.5} aria-hidden="true" />
      <h1 className="mt-6 text-4xl font-extrabold tracking-tighter italic sm:text-5xl">{t("doneTitle")}</h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        {t("doneBody", { category: t(`categories.${category}`), level: t(`levels.${level}.name`) })}
      </p>
      <div className="max-w-xl">
        <ProgressBar progress={progress} />
      </div>
      <Button className="mt-8" size="lg" onClick={onBack}>
        <ArrowLeft aria-hidden="true" />
        {t("doneBack")}
      </Button>
    </div>
  );
}
