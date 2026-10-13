import { z } from "zod";

import { InfrastructureError, InsufficientCreditsError, NotFoundError, UnauthorizedError } from "@/core/errors";
import { parseOrThrow } from "@/core/validate";
import type { AuthService } from "@/modules/auth/application/auth-service";
import type { CreditStore } from "@/modules/credits/application/credit-store";
import { GRADING_COST } from "@/modules/credits/domain/credits";

import { DEFAULT_GRADING_MODE, GRADING_MODES } from "../domain/grading-mode";
import { answerKey, closestAnswer, findMatchingAnswer, structureNotes } from "../domain/accepted-answer";
import { MAX_ANSWER_LENGTH, normalizeAnswer } from "../domain/sentence-answer";
import type { FeedbackLanguage, SentenceGrade } from "../domain/sentence-grade";
import type { SentenceProgress } from "../domain/sentence-progress";
import type { AttemptStore } from "./attempt-store";
import type { GradeCache } from "./grade-cache";
import { loadProgress } from "./load-progress";
import type { ReferenceAnswerSource } from "./reference-answer-source";
import type { SentenceGrader } from "./sentence-grader";
import type { SentenceProgressStore } from "./sentence-progress-store";
import type { SentencePromptSource } from "./sentence-prompt-source";

const gradeSchema = z.object({
  promptId: z.uuid(),
  answer: z.string().trim().min(1).max(MAX_ANSWER_LENGTH),
  mode: z.enum(GRADING_MODES).optional().default(DEFAULT_GRADING_MODE),
});

export interface GradeSentenceDeps {
  auth: AuthService;
  prompts: SentencePromptSource;
  credits: CreditStore;
  grader: SentenceGrader;
  cache: GradeCache;
  progress: SentenceProgressStore;
  references: ReferenceAnswerSource;
  /** Optional so older callers keep working; when set, every graded attempt is saved for the history. */
  attempts?: AttemptStore;
}

export interface GradeSentenceResult {
  grade: SentenceGrade;
  /** Balance after this call. */
  credits: number;
  /** Set when the answer was correct: the sentence is now recorded as completed. */
  progress: SentenceProgress | null;
  /** Set when the answer was correct: points earned now (0 if the sentence was done before) and the new total. */
  points: { earned: number; total: number } | null;
  /** Who produced the grade: the AI, or the accepted answers of the prompt. */
  source: "ai" | "reference";
}

/**
 * Grades the learner's answer to a stored prompt.
 * A wrong answer costs one credit every time it is sent (an edited retry included); a correct answer is free
 * and is recorded as completed, so that sentence is not offered again.
 * Order matters for quota: an answer that equals an accepted answer of the prompt is correct without the AI
 * (and without a balance check), a cached grade is free, the balance is checked BEFORE the AI is called,
 * and credits are taken only AFTER the AI answered, so a failing AI never costs the learner anything.
 * With mode "reference" the AI is never called and nothing is charged: the answer is only compared with the accepted
 * answers, and a miss is "not correct yet" and shows the closest accepted answer with its grammar notes.
 * `language` comes from the server (the interface language), never from the browser.
 */
/** The accepted answers are an optimisation: when they cannot be read, the AI still grades. */
async function readAcceptedAnswers(references: ReferenceAnswerSource, promptId: string) {
  try {
    return await references.find(promptId);
  } catch (error) {
    if (error instanceof InfrastructureError) return [];
    throw error;
  }
}

export async function gradeSentence(
  { auth, prompts, credits, grader, cache, progress, references, attempts }: GradeSentenceDeps,
  input: unknown,
  language: FeedbackLanguage
): Promise<GradeSentenceResult> {
  const { promptId, answer, mode } = parseOrThrow(gradeSchema, input);
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError("You are not signed in");

  const prompt = await prompts.get(promptId);
  if (!prompt) throw new NotFoundError("Sentence not found");

  const run = async (): Promise<GradeSentenceResult> => {
    const normalized = normalizeAnswer(answer);
    // The feedback text depends on the language, so the language is part of the key.
    const key = `${language}\u0000${prompt.id}\u0000${normalized}`;

    const selection = { level: prompt.level, category: prompt.category };
    /** A correct answer is free and counts as done, whether it was graded just now or came from the cache. */
    const complete = async (
      grade: SentenceGrade,
      balance: number,
      source: GradeSentenceResult["source"]
    ): Promise<GradeSentenceResult> => {
      const { awarded, totalPoints } = await progress.markCompleted(user.id, prompt.id);
      const loaded = await loadProgress({ prompts, progress }, user.id, selection);
      return { grade, credits: balance, progress: loaded.progress, points: { earned: awarded, total: totalPoints }, source };
    };

    // Reference mode must not hide a failing read behind the AI the learner chose not to use.
    const acceptedAnswers =
      mode === "reference" ? await references.find(prompt.id) : await readAcceptedAnswers(references, prompt.id);
    const accepted = findMatchingAnswer(acceptedAnswers, normalized);
    if (accepted) {
      const grade: SentenceGrade = {
        correct: true,
        suggestion: accepted.text,
        improvements: structureNotes(accepted, language),
        comment: "",
      };
      return complete(grade, await credits.balance(user.id), "reference");
    }

    if (mode === "reference") {
      // A miss still teaches: show the closest accepted answer and its grammar notes. The learner chose this
      // way of checking, so nothing is hidden and nothing is charged.
      const closest = closestAnswer(acceptedAnswers, normalized);
      const grade: SentenceGrade = {
        correct: false,
        suggestion: closest?.text ?? "",
        improvements: closest ? structureNotes(closest, language) : [],
        comment: "",
      };
      return { grade, credits: await credits.balance(user.id), progress: null, points: null, source: "reference" };
    }

    const cached = cache.get(key);
    if (cached) {
      const balance = await credits.balance(user.id);
      return cached.correct
        ? complete(cached, balance, "ai")
        : { grade: cached, credits: balance, progress: null, points: null, source: "ai" };
    }

    const balance = await credits.balance(user.id);
    if (balance < GRADING_COST) throw new InsufficientCreditsError("Not enough credits");

    const grade = await grader.grade({ vietnamese: prompt.vietnamese, level: prompt.level, answer: normalized, language });
    cache.set(key, grade);

    if (grade.correct) return complete(grade, balance, "ai");

    const remaining = await credits.spend(GRADING_COST);
    if (remaining === null) throw new InsufficientCreditsError("Not enough credits");
    return { grade, credits: remaining, progress: null, points: null, source: "ai" };
  };

  const result = await run();
  // Only correct answers are kept: the history is for reviewing good answers, and wrong ones would only fill the table.
  if (attempts && result.grade.correct) {
    // The history is a nicety: a failure to save it must not take away a grade the learner already got (and paid for).
    try {
      await attempts.record({
        userId: user.id,
        promptId: prompt.id,
        mode,
        correct: result.grade.correct,
        answer,
        answerKey: answerKey(answer),
        source: result.source,
        language,
        suggestion: result.grade.suggestion,
        improvements: result.grade.improvements,
        comment: result.grade.comment,
      });
    } catch (error) {
      if (!(error instanceof InfrastructureError)) throw error;
      // The cause is a connection or configuration message, never the answer text.
      const cause = error.cause;
      console.error(`Attempt not saved: ${error.message}${cause instanceof Error ? ` (${cause.message})` : ""}`);
    }
  }
  return result;
}
