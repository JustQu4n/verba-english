import type { AcceptedAnswer } from "../domain/accepted-answer";

/** Where the accepted answers of a prompt are read when grading. Learners never get this list. */
export interface ReferenceAnswerSource {
  /** Accepted answers of a prompt; empty when it has none. */
  find(promptId: string): Promise<AcceptedAnswer[]>;
}
