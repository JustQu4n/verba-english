import type { AttemptRecord, NewAttempt } from "../domain/attempt";

/** Remembers every graded attempt of a learner so they can review it later. */
export interface AttemptStore {
  /** Writes the attempt, the learner's answer and the grade together. Only trusted server code may call it. */
  record(attempt: NewAttempt): Promise<void>;
  /** The learner's attempts, newest first; `total` counts all of them. */
  list(userId: string, page: { offset: number; limit: number }): Promise<{ items: AttemptRecord[]; total: number }>;
}
