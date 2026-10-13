import type { SentenceGrade } from "../domain/sentence-grade";

/** Remembers grades so the same answer to the same prompt is never graded twice. */
export interface GradeCache {
  get(key: string): SentenceGrade | undefined;
  set(key: string, grade: SentenceGrade): void;
}
