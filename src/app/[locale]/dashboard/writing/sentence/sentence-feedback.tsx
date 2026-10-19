"use client";

import { Check, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { splitBold } from "@/lib/bold-text";
import { cn } from "@/lib/utils";
import { diffAnswer } from "@/modules/writing/domain/answer-diff";

import { suggestionVisible, type FeedbackState } from "./feedback-state";

interface SentenceFeedbackProps {
  feedback: FeedbackState;
  /** What is in the answer box now: editing it after a wrong answer hides the suggestion. */
  answer: string;
  /** The answer was graded correct and is unchanged: the learner may continue. */
}

/** AI feedback for the last submitted answer. Wrong answers keep the learner here until they are right. */
export function SentenceFeedback({ feedback, answer }: SentenceFeedbackProps) {
  const t = useTranslations("Sentence");

  return (
    <section aria-labelledby="feedback-heading" className="mt-10 rounded-2xl border p-6">
      <h2 id="feedback-heading" className="text-base font-semibold tracking-tight">
        {t("feedbackTitle")}
      </h2>

      <div aria-live="polite" aria-busy={feedback.status === "grading"} className="mt-3 text-sm/relaxed">
        {feedback.status === "idle" && (
          <p className="rounded-lg bg-muted px-4 py-3">{t("feedbackIdle")}</p>
        )}

        {feedback.status === "grading" && (
          <p className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3">
            <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />
            {t("grading")}
          </p>
        )}

        {feedback.status === "error" && (
          <p role="alert" className="rounded-lg bg-muted px-4 py-3 font-medium">
            {feedback.mode === "reference" && feedback.reason === "unavailable"
              ? t("gradeErrors.referenceUnavailable")
              : t(`gradeErrors.${feedback.reason}`)}
          </p>
        )}

        {feedback.status === "graded" && (
          <div className="flex flex-col gap-4">
            <p
              className={cn(
                "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
                feedback.grade.correct ? "bg-solid text-on-solid" : "border-2 border-foreground"
              )}
            >
              {feedback.grade.correct ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <X className="size-4" aria-hidden="true" />
              )}
              {feedback.grade.correct ? t("correct") : t("incorrect")}
            </p>
            {feedback.earned > 0 && (
              <p className="w-fit rounded-full border-2 border-foreground px-3 py-1 text-sm font-bold tabular-nums">
                {t("pointsEarned", { count: feedback.earned })}
              </p>
            )}

            {feedback.grade.suggestion && suggestionVisible(feedback, answer) && (
              <p>
                <span className="font-semibold">{t("feedbackSuggestion")}:</span>{" "}
                <span lang="en" data-dictionary="" className="text-base font-medium">
                  {feedback.grade.correct ? feedback.grade.suggestion : <MarkedAnswer answer={feedback.answer} suggestion={feedback.grade.suggestion} />}
                </span>
              </p>
            )}

            {feedback.grade.improvements.length > 0 && (
              <div>
                <p className="font-semibold">{t(feedback.grade.correct || feedback.source === "reference" ? "feedbackStructure" : "feedbackImprovements")}:</p>
                <ul data-dictionary="" className="mt-1.5 list-disc space-y-1.5 pl-5">
                  {feedback.grade.improvements.map((note) => (
                    <li key={note}>
                      <BoldText text={note} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.grade.comment && (
              <p>
                <span className="font-semibold">{t("feedbackComment")}:</span> <span lang="vi">{feedback.grade.comment}</span>
              </p>
            )}

            {!feedback.grade.correct && (
              <p className="text-muted-foreground">{t(feedback.source !== "reference" ? "tryAgain" : feedback.grade.suggestion ? "referenceMiss" : "referenceNone")}</p>
            )}
          </div>
        )}
      </div>

    </section>
  );
}

/** The learner's own answer, with wrong words in red and the fix in green brackets beside them. */
function MarkedAnswer({ answer, suggestion }: { answer: string; suggestion: string }) {
  const t = useTranslations("Sentence");
  const parts = diffAnswer(answer, suggestion);
  return (
    <>
      {parts.map((part, index) => {
        const space = index > 0 ? " " : "";
        if (part.kind === "same") return <span key={index}>{space + part.text}</span>;
        return (
          <span key={index}>
            {space}
            {part.kind === "wrong" && (
              <mark className="rounded-sm bg-red-500/15 px-0.5 font-semibold text-red-700 dark:text-red-400">
                <span className="sr-only">{t("diffWrong")} </span>
                {part.text}
              </mark>
            )}
            {part.kind === "wrong" && part.fix && " "}
            {(part.kind === "missing" || part.fix) && (
              <span className="font-semibold text-green-700 dark:text-green-400">
                <span className="sr-only">{t("diffFix")} </span>({part.kind === "missing" ? part.text : part.fix})
              </span>
            )}
          </span>
        );
      })}
    </>
  );
}

/** Text with **bold** markers from the AI turned into real emphasis. */
function BoldText({ text }: { text: string }) {
  return (
    <>
      {splitBold(text).map((part, index) =>
        part.bold ? (
          <strong key={index} className="font-bold">
            {part.text}
          </strong>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </>
  );
}
