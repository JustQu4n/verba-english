"use client";

import { ArrowLeft, Lightbulb, Send, SkipForward } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { canSubmitAnswer, MAX_ANSWER_LENGTH } from "@/modules/writing/domain/sentence-answer";
import type { Category, Level, SentencePrompt } from "@/modules/writing/domain/sentence-catalog";

interface SentencePracticeProps {
  prompt: SentencePrompt;
  level: Level;
  category: Category;
  /** 1-based position of the sentence in this session. */
  position: number;
  answer: string;
  onAnswerChange: (answer: string) => void;
  hintOpen: boolean;
  onToggleHint: () => void;
  submitted: boolean;
  onSubmit: () => void;
  onSkip: () => void;
  onNext: () => void;
  onQuit: () => void;
  loading: boolean;
  error: "unauthorized" | "not_found" | "unknown" | null;
}

/** The practice screen: one Vietnamese sentence, one answer box, and a feedback panel underneath. */
export function SentencePractice({
  prompt,
  level,
  category,
  position,
  answer,
  onAnswerChange,
  hintOpen,
  onToggleHint,
  submitted,
  onSubmit,
  onSkip,
  onNext,
  onQuit,
  loading,
  error,
}: SentencePracticeProps) {
  const t = useTranslations("Sentence");
  const [focused, setFocused] = useState(false);
  const length = answer.trim().length;
  const tooLong = length > MAX_ANSWER_LENGTH;
  const canSubmit = canSubmitAnswer(answer) && !submitted && !loading;

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && canSubmit) {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex items-center justify-between gap-4 text-sm">
        <p className="inline-flex min-w-0 items-center rounded-full border px-3 py-1 font-medium">
          <span className="truncate">{t(`categories.${category}`)}</span>
          <span className="mx-2 text-muted-foreground" aria-hidden="true">/</span>
          <span className="shrink-0">{t(`levels.${level}.name`)}</span>
        </p>
        <p className="shrink-0 font-medium text-muted-foreground">{t("sentenceNumber", { n: position })}</p>
      </div>

      <p className="mt-10 text-sm text-muted-foreground">{t("translateLabel")}</p>
      <h1 lang="vi" className="mt-2 text-3xl/tight font-semibold tracking-tight text-balance sm:text-4xl/tight">
        {prompt.vietnamese}
      </h1>

      {hintOpen && (
        <p className="mt-5 rounded-lg bg-muted px-4 py-3 text-sm">
          <span className="font-semibold">{t("hintLabel")}</span>
          <span className="text-muted-foreground">: </span>
          <span lang="en">{prompt.hint}</span>
        </p>
      )}

      <div className="mt-8">
        <label htmlFor="answer" className="sr-only">
          {t("answerLabel")}
        </label>
        <div
          className={cn(
            "rounded-xl border-2 bg-background transition-colors",
            focused ? "border-foreground" : "border-input"
          )}
        >
          <textarea
            id="answer"
            lang="en"
            rows={4}
            value={answer}
            onChange={(event) => onAnswerChange(event.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={t("placeholder")}
            aria-describedby="answer-count"
            aria-invalid={tooLong}
            spellCheck={false}
            autoCapitalize="sentences"
            className="block w-full resize-none rounded-xl bg-transparent px-4 pt-4 text-lg/relaxed outline-none placeholder:text-muted-foreground"
          />
          <p
            id="answer-count"
            className={cn("px-4 pb-3 text-right text-xs tabular-nums", tooLong ? "text-destructive" : "text-muted-foreground")}
          >
            {t("count", { count: length, max: MAX_ANSWER_LENGTH })}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={onQuit}>
          <ArrowLeft aria-hidden="true" />
          {t("quit")}
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={onSkip} disabled={loading}>
            <SkipForward aria-hidden="true" />
            {t("skip")}
          </Button>
          <Button variant="outline" onClick={onToggleHint} aria-pressed={hintOpen}>
            <Lightbulb aria-hidden="true" />
            {hintOpen ? t("hideHint") : t("hint")}
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit}>
            <Send aria-hidden="true" />
            {t("submit")}
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-destructive">
          {t(`errors.${error}`)}{" "}
          {error === "unauthorized" && (
            <Link href="/login" className="underline underline-offset-4">
              {t("signInAgain")}
            </Link>
          )}
        </p>
      )}

      <section aria-labelledby="feedback-heading" className="mt-10 rounded-2xl border p-6">
        <h2 id="feedback-heading" className="text-base font-semibold tracking-tight">
          {t("feedbackTitle")}
        </h2>
        <p className="mt-3 rounded-lg bg-muted px-4 py-3 text-sm/relaxed" aria-live="polite">
          {submitted ? t("feedbackUnavailable") : t("feedbackIdle")}
        </p>
        {submitted && (
          <Button className="mt-4" onClick={onNext} disabled={loading}>
            {t("next")}
          </Button>
        )}
      </section>
    </div>
  );
}
