import type { Category, Level } from "./sentence-catalog";

/** How far a learner is within one level and category. */
export interface SentenceProgress {
  completed: number;
  total: number;
}

/** Whole percent, 0 when there is nothing to complete. */
export function progressPercent({ completed, total }: SentenceProgress): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((completed / total) * 100));
}

/** Progress of every category in one level. */
export type LevelProgress = Record<Category, SentenceProgress>;

/** Progress of every category in every level. */
export type AllLevelsProgress = Record<Level, LevelProgress>;

/** The same progress with one level + category replaced (a new object; the input is not changed). Null stays null. */
export function withCategoryProgress(
  all: AllLevelsProgress | null,
  level: Level,
  category: Category,
  progress: SentenceProgress
): AllLevelsProgress | null {
  if (!all) return null;
  return { ...all, [level]: { ...all[level], [category]: progress } };
}
