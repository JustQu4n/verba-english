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
