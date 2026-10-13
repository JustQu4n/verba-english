import type { Category, Level, SentenceSelection } from "../domain/sentence-catalog";

/** Remembers which sentences a learner has completed. */
export interface SentenceProgressStore {
  /** Ids of the published prompts of this level and category that the user completed. */
  completedIds(userId: string, selection: SentenceSelection): Promise<Set<string>>;
  /** Completed published sentences per category of a level, from the stored counters. Categories without any are left out. */
  completedByCategory(userId: string, level: Level): Promise<Partial<Record<Category, number>>>;
  /**
   * Records a completion and awards points the first time. Recording the same prompt again is not an error
   * and awards nothing. Only trusted server code may call this: the answer was verified by the grader.
   */
  markCompleted(userId: string, promptId: string): Promise<CompletionResult>;
}

export interface CompletionResult {
  /** Points awarded by this call: 0 when the prompt was already completed. */
  awarded: number;
  /** The user's total points after this call. */
  totalPoints: number;
}
