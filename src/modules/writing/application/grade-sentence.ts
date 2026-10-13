import { z } from "zod";

import { InsufficientCreditsError, NotFoundError, UnauthorizedError } from "@/core/errors";
import { parseOrThrow } from "@/core/validate";
import type { AuthService } from "@/modules/auth/application/auth-service";
import type { CreditStore } from "@/modules/credits/application/credit-store";
import { GRADING_COST } from "@/modules/credits/domain/credits";

import { MAX_ANSWER_LENGTH, normalizeAnswer } from "../domain/sentence-answer";
import type { FeedbackLanguage, SentenceGrade } from "../domain/sentence-grade";
import type { SentenceProgress } from "../domain/sentence-progress";
import type { GradeCache } from "./grade-cache";
import { loadProgress } from "./load-progress";
import type { SentenceGrader } from "./sentence-grader";
import type { SentenceProgressStore } from "./sentence-progress-store";
import type { SentencePromptSource } from "./sentence-prompt-source";

const gradeSchema = z.object({
  promptId: z.uuid(),
  answer: z.string().trim().min(1).max(MAX_ANSWER_LENGTH),
});

export interface GradeSentenceDeps {
  auth: AuthService;
  prompts: SentencePromptSource;
  credits: CreditStore;
  grader: SentenceGrader;
  cache: GradeCache;
  progress: SentenceProgressStore;
}

export interface GradeSentenceResult {
  grade: SentenceGrade;
  /** Balance after this call. */
  credits: number;
  /** Set when the answer was correct: the sentence is now recorded as completed. */
  progress: SentenceProgress | null;
  /** Set when the answer was correct: points earned now (0 if the sentence was done before) and the new total. */
  points: { earned: number; total: number } | null;
}

/**
 * Grades the learner's answer to a stored prompt.
 * A wrong answer costs one credit every time it is sent (an edited retry included); a correct answer is free
 * and is recorded as completed, so that sentence is not offered again.
 * Order matters for quota: a cached grade is free, the balance is checked BEFORE the AI is called,
 * and credits are taken only AFTER the AI answered, so a failing AI never costs the learner anything.
 * `language` comes from the server (the interface language), never from the browser.
 */
export async function gradeSentence(
  { auth, prompts, credits, grader, cache, progress }: GradeSentenceDeps,
  input: unknown,
  language: FeedbackLanguage
): Promise<GradeSentenceResult> {
  const { promptId, answer } = parseOrThrow(gradeSchema, input);
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError("You are not signed in");

  const prompt = await prompts.get(promptId);
  if (!prompt) throw new NotFoundError("Sentence not found");

  const normalized = normalizeAnswer(answer);
  // The feedback text depends on the language, so the language is part of the key.
  const key = `${language}\u0000${prompt.id}\u0000${normalized}`;

  const selection = { level: prompt.level, category: prompt.category };
  /** A correct answer is free and counts as done, whether it was graded just now or came from the cache. */
  const complete = async (grade: SentenceGrade, balance: number): Promise<GradeSentenceResult> => {
    const { awarded, totalPoints } = await progress.markCompleted(user.id, prompt.id);
    const loaded = await loadProgress({ prompts, progress }, user.id, selection);
    return { grade, credits: balance, progress: loaded.progress, points: { earned: awarded, total: totalPoints } };
  };

  const cached = cache.get(key);
  if (cached) {
    const balance = await credits.balance(user.id);
    return cached.correct ? complete(cached, balance) : { grade: cached, credits: balance, progress: null, points: null };
  }

  const balance = await credits.balance(user.id);
  if (balance < GRADING_COST) throw new InsufficientCreditsError("Not enough credits");

  const grade = await grader.grade({ vietnamese: prompt.vietnamese, level: prompt.level, answer: normalized, language });
  cache.set(key, grade);

  if (grade.correct) return complete(grade, balance);

  const remaining = await credits.spend(GRADING_COST);
  if (remaining === null) throw new InsufficientCreditsError("Not enough credits");
  return { grade, credits: remaining, progress: null, points: null };
}
