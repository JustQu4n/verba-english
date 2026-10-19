import { z } from "zod";

export const MAX_WORD_LENGTH = 60;

/** One meaning of a word. `vietnamese` is true when the definition is written in Vietnamese. */
export interface DictionaryMeaning {
  definition: string;
  pos: string | null;
  example: string | null;
  vietnamese: boolean;
}

/** Where an entry came from: the dictionary service, an AI translation the learner asked for, or typed by the learner (no meaning yet). */
export type EntrySource = "dictionary" | "ai" | "manual";

/** What the popup shows for a word. Small on purpose: it is cached and saved as it is. */
export interface DictionaryEntry {
  word: string;
  ipa: string | null;
  /** Absolute address of the pronunciation audio. */
  audioUrl: string | null;
  /** Empty for a word saved without any meaning. */
  meanings: DictionaryMeaning[];
  source: EntrySource;
}

export interface SavedWord {
  entry: DictionaryEntry;
  savedAt: Date;
}

const WORD_PATTERN = /^\p{L}[\p{L}'\- ]*$/u;

/**
 * Cleans a selected text into a lookup key: no punctuation at both ends, one space between words, lower case.
 * Returns null when what is left cannot be a word or short phrase.
 */
export function cleanWord(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const word = input
    .replace(/[‘’]/g, "'")
    .replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
  if (word.length === 0 || word.length > MAX_WORD_LENGTH || !WORD_PATTERN.test(word)) return null;
  return word;
}

/** Zod schema for a word that arrives from outside; the error is a stable code the screen translates. */
export const wordSchema = z.unknown().transform((value, ctx) => {
  const word = cleanWord(value);
  if (word === null) {
    ctx.addIssue({ code: "custom", message: "invalid_word" });
    return z.NEVER;
  }
  return word;
});

const meaningSchema = z.object({
  definition: z.string().min(1),
  pos: z.string().nullable(),
  example: z.string().nullable(),
  vietnamese: z.boolean(),
});

const entrySchema = z.object({
  word: z.string().min(1),
  ipa: z.string().nullable(),
  audioUrl: z.string().nullable(),
  meanings: z.array(meaningSchema),
  // Entries saved before this field existed came from the dictionary.
  source: z.enum(["dictionary", "ai", "manual"]).default("dictionary"),
});

/** A word saved on its own: no meaning yet, the learner can ask the AI for one later. */
export function bareEntry(word: string): DictionaryEntry {
  return { word, ipa: null, audioUrl: null, meanings: [], source: "manual" };
}

/** Reads a stored entry (cache or saved word). Returns null for damaged data so one bad row cannot break a list. */
export function parseEntry(value: unknown): DictionaryEntry | null {
  const result = entrySchema.safeParse(value);
  return result.success ? result.data : null;
}
