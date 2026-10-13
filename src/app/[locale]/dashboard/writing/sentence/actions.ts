"use server";

import { getLocale } from "next-intl/server";
import { unstable_rethrow } from "next/navigation";

import {
  InfrastructureError,
  InsufficientCreditsError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/core/errors";
import { gradeSentence } from "@/modules/writing/application/grade-sentence";
import { getLevelProgress, type LevelProgress } from "@/modules/writing/application/get-level-progress";
import { getSentenceProgress } from "@/modules/writing/application/get-sentence-progress";
import { getNextSentence } from "@/modules/writing/application/get-next-sentence";
import type { SentencePrompt } from "@/modules/writing/domain/sentence-catalog";
import type { SentenceGrade } from "@/modules/writing/domain/sentence-grade";
import type { SentenceProgress } from "@/modules/writing/domain/sentence-progress";
import { getContainer } from "@/server/container";

export type NextSentenceResult =
  /** `prompt` is null when every sentence of the pair is completed. */
  | { status: "ok"; prompt: SentencePrompt | null; progress: SentenceProgress }
  | { status: "error"; reason: "unauthorized" | "not_found" | "unknown" };

/** Returns the next practice sentence for the chosen level and category, skipping completed ones. */
export async function nextSentence(input: unknown): Promise<NextSentenceResult> {
  try {
    const { auth, sentencePrompts, sentenceProgress } = await getContainer();
    const { prompt, progress } = await getNextSentence(
      { auth, prompts: sentencePrompts, progress: sentenceProgress },
      input
    );
    return { status: "ok", prompt, progress };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { status: "error", reason: "unauthorized" };
    if (error instanceof NotFoundError) return { status: "error", reason: "not_found" };
    unstable_rethrow(error);
    console.error(error);
    return { status: "error", reason: "unknown" };
  }
}

export type SentenceProgressResult =
  | { status: "ok"; progress: SentenceProgress }
  | { status: "error" };

/** Progress of the signed-in user in one level and category (for the choose screen). */
export async function sentenceProgress(input: unknown): Promise<SentenceProgressResult> {
  try {
    const { auth, sentencePrompts, sentenceProgress: store } = await getContainer();
    return { status: "ok", progress: await getSentenceProgress({ auth, prompts: sentencePrompts, progress: store }, input) };
  } catch (error) {
    unstable_rethrow(error);
    // The bar is a nicety: a failure just hides it.
    if (!(error instanceof UnauthorizedError || error instanceof ValidationError)) console.error(error);
    return { status: "error" };
  }
}

export type LevelProgressResult = { status: "ok"; progress: LevelProgress } | { status: "error" };

/** Progress of the signed-in user in every category of one level (for the choose screen). */
export async function levelProgress(input: unknown): Promise<LevelProgressResult> {
  try {
    const { auth, sentencePrompts, sentenceProgress: store } = await getContainer();
    return { status: "ok", progress: await getLevelProgress({ auth, prompts: sentencePrompts, progress: store }, input) };
  } catch (error) {
    unstable_rethrow(error);
    // The bars are a nicety: a failure just hides them.
    if (!(error instanceof UnauthorizedError || error instanceof ValidationError)) console.error(error);
    return { status: "error" };
  }
}

/** Points earned by this answer and the new total; set only when a sentence was just completed. */
export interface PointsResult {
  earned: number;
  total: number;
}

export type GradeAnswerResult =
  /** `progress` is set when the answer was correct and has just been recorded. */
  | { status: "ok"; grade: SentenceGrade; credits: number; progress: SentenceProgress | null; points: PointsResult | null; source: "ai" | "reference" }
  | {
      status: "error";
      reason: "unauthorized" | "not_found" | "invalid" | "no_credits" | "unavailable" | "unknown";
    };

/** Grades the learner's answer to a stored prompt, by AI (a wrong answer costs a credit) or against the accepted answers (free). */
export async function gradeAnswer(input: unknown): Promise<GradeAnswerResult> {
  try {
    const { auth, sentencePrompts, credits, grader, gradeCache, sentenceProgress: progressStore, references } = await getContainer();
    const { grade, credits: remaining, progress, points, source } = await gradeSentence(
      { auth, prompts: sentencePrompts, credits, grader, cache: gradeCache, progress: progressStore, references },
      input,
      (await getLocale()) === "en" ? "en" : "vi"
    );
    return { status: "ok", grade, credits: remaining, progress, points, source };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { status: "error", reason: "unauthorized" };
    if (error instanceof NotFoundError) return { status: "error", reason: "not_found" };
    if (error instanceof ValidationError) return { status: "error", reason: "invalid" };
    if (error instanceof InsufficientCreditsError) return { status: "error", reason: "no_credits" };
    if (error instanceof InfrastructureError) {
      // The message is ours and safe (no answer text, no key); the cause is left out of the log on purpose.
      // The cause is a connection or configuration message (never the answer text), and it is what tells the owner
      // what to fix, e.g. a missing service key or a missing table.
      const cause = error.cause;
      const detail = typeof cause === "object" && cause !== null && "message" in cause ? String(cause.message) : "";
      console.error(`Sentence grading failed: ${error.message}${detail ? ` (${detail})` : ""}`);
      return { status: "error", reason: "unavailable" };
    }
    unstable_rethrow(error);
    console.error(error);
    return { status: "error", reason: "unknown" };
  }
}
