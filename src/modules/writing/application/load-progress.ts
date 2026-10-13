import type { SentencePrompt, SentenceSelection } from "../domain/sentence-catalog";
import type { SentenceProgress } from "../domain/sentence-progress";
import type { SentenceProgressStore } from "./sentence-progress-store";
import type { SentencePromptSource } from "./sentence-prompt-source";

export interface ProgressDeps {
  prompts: SentencePromptSource;
  progress: SentenceProgressStore;
}

export interface LoadedProgress {
  /** Every published prompt of the pair. */
  all: SentencePrompt[];
  /** The ones the user has not completed yet. */
  remaining: SentencePrompt[];
  progress: SentenceProgress;
}

/** Reads the published prompts of a pair and what the user finished. Only still-published prompts count. */
export async function loadProgress(
  { prompts, progress }: ProgressDeps,
  userId: string,
  selection: SentenceSelection
): Promise<LoadedProgress> {
  const [all, done] = await Promise.all([prompts.list(selection), progress.completedIds(userId, selection)]);
  const remaining = all.filter((p) => !done.has(p.id));
  return { all, remaining, progress: { completed: all.length - remaining.length, total: all.length } };
}
