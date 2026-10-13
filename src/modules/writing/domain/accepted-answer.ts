import type { FeedbackLanguage } from "./sentence-grade";

export const MAX_ACCEPTED_ANSWERS = 5;
export const MAX_ANSWER_TEXT_LENGTH = 300;
export const MAX_STRUCTURE_LENGTH = 500;

/** A correct English translation of a prompt, with a short note on its grammar structure in both languages. */
export interface AcceptedAnswer {
  readonly text: string;
  readonly structureVi: string;
  readonly structureEn: string;
}

/** Comparison key: ignores case, punctuation, curly quotes and extra spaces; apostrophes and hyphens inside words stay. */
export function answerKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[^\p{L}\p{N}'\-\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The first accepted answer that equals the learner's text, or null. */
export function findMatchingAnswer(answers: readonly AcceptedAnswer[], input: string): AcceptedAnswer | null {
  const key = answerKey(input);
  if (key === "") return null;
  return answers.find((answer) => answerKey(answer.text) === key) ?? null;
}

/** The grammar notes of an answer in the feedback language, one note per non-empty line. */
export function structureNotes(answer: AcceptedAnswer, language: FeedbackLanguage): string[] {
  const text = language === "vi" ? answer.structureVi : answer.structureEn;
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const words = (text: string) => new Set(answerKey(text).split(" ").filter(Boolean));

/** The accepted answer sharing the most words with the learner's text; the earlier one wins a tie. */
export function closestAnswer(answers: readonly AcceptedAnswer[], input: string): AcceptedAnswer | null {
  const given = words(input);
  let best: AcceptedAnswer | null = null;
  let bestScore = -1;
  for (const answer of answers) {
    const own = words(answer.text);
    const shared = [...own].filter((word) => given.has(word)).length;
    // Jaccard: shared words over all distinct words, so a long answer is not favoured for being long.
    const score = shared / (own.size + given.size - shared || 1);
    if (score > bestScore) {
      best = answer;
      bestScore = score;
    }
  }
  return best;
}
