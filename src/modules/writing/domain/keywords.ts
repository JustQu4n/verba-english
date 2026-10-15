import { MAX_HINT_LENGTH } from "./prompt";

/** Separator stored in `prompt.hint`; keeps every hint written before key-word chips readable. */
export const KEYWORD_SEPARATOR = ", ";

/** At most this many key words are kept from an AI reply: more would give the sentence away. */
export const MAX_SUGGESTED_KEYWORDS = 8;

const sameWord = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Splits text on commas and line breaks into trimmed, non-empty key words, dropping repeats (case-insensitive). */
export function parseKeywords(text: string): string[] {
  const words: string[] = [];
  for (const piece of text.split(/[,\n;]/)) {
    const word = piece.trim().replace(/\s+/g, " ");
    if (word !== "" && !words.some((known) => sameWord(known, word))) words.push(word);
  }
  return words;
}

export const joinKeywords = (words: readonly string[]): string => words.join(KEYWORD_SEPARATOR);

/** Adds new words after the existing ones, skipping repeats and anything that would pass the hint length limit. */
export function mergeKeywords(current: readonly string[], extra: readonly string[], maxLength = MAX_HINT_LENGTH): string[] {
  const merged = [...current];
  for (const word of parseKeywords(extra.join(","))) {
    if (merged.some((known) => sameWord(known, word))) continue;
    if (joinKeywords([...merged, word]).length > maxLength) break;
    merged.push(word);
  }
  return merged;
}
