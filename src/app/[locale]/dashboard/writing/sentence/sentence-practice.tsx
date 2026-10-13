"use client";

import { ArrowLeft, Lightbulb, Send, SkipForward } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { canSubmitAnswer, MAX_ANSWER_LENGTH } from "@/modules/writing/domain/sentence-answer";
import type { Category, Level, SentencePrompt } from "@/modules/writing/domain/sentence-catalog";
import type { SentenceProgress } from "@/modules/writing/domain/sentence-progress";

import { ProgressBar } from "./progress-bar";
import { isGradedAnswer, type FeedbackState } from "./feedback-state";
import { SentenceFeedback } from "./sentence-feedback";

interface SentencePracticeProps {
  prompt: SentencePrompt;
  level: Level;
  category: Category;
  progress: SentenceProgress | null;
  answer: string;
  onAnswerChange: (answer: string) => void;
  hintOpen: boolean;
  onToggleHint: () => void;
  feedback: FeedbackState;
  /** Graded correct and unchanged since: the learner may continue. */
  passed: boolean;
  credits: number | null;
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
  progress,
  answer,
  onAnswerChange,
  hintOpen,
  onToggleHint,
  feedback,
  passed,
  credits,
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
  const grading = feedback.status === "grading";
  const outOfCredits = credits !== null && credits < 1;
  // The same graded answer cannot be sent twice: it would only spend credit on the same verdict.
  const canSubmit = canSubmitAnswer(answer) && !grading && !loading && !passed && !isGradedAnswer(feedback, answer) && !outOfCredits;

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends (Shift+Enter keeps a new line); Enter during IME composition only confirms the text.
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (passed) {
      if (!loading) onNext();
    } else if (canSubmit) {
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
      </div>
      {progress && <ProgressBar progress={progress} />}

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
            readOnly={passed}
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
        <p className="mt-2 text-xs text-muted-foreground">{t(passed ? "enterNext" : "enterHint")}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={onQuit}>
          <ArrowLeft aria-hidden="true" />
          {t("quit")}
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={onSkip} disabled={loading || grading}>
            <SkipForward aria-hidden="true" />
            {t("skip")}
          </Button>
          <Button variant="outline" onClick={onToggleHint} aria-pressed={hintOpen}>
            <Lightbulb aria-hidden="true" />
            {hintOpen ? t("hideHint") : t("hint")}
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit}>
            <Send aria-hidden="true" />
            {grading ? t("grading") : t("submit")}
          </Button>
        </div>
      </div>

      {outOfCredits && (
        <p role="status" className="mt-4 rounded-lg border-2 border-foreground px-4 py-3 text-sm font-medium">
          {t("noCredits")}
        </p>
      )}

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

      <SentenceFeedback
        feedback={feedback}
        passed={passed}
        onNext={onNext}
        loading={loading}
      />
    </div>
  );
}
