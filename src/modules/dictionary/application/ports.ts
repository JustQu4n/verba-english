import type { DictionaryEntry, SavedWord } from "../domain/dictionary-entry";

/** The dictionary service. `null` when it has no such word; throws an infrastructure error when it cannot be reached. */
export interface DictionaryProvider {
  lookup(word: string): Promise<DictionaryEntry | null>;
}

/** Writes the meaning of a word with an AI. Throws an infrastructure error when it cannot. */
export interface WordTranslator {
  /** The entry (Vietnamese meanings, source "ai"); meanings are empty when the text is not a real English word. */
  translate(word: string): Promise<DictionaryEntry>;
}

/** What the cache remembers about a word: the entry, or `null` when the dictionary does not know it. */
export interface CachedLookup {
  entry: DictionaryEntry | null;
}

/** Lookups kept so the dictionary service is called once per word, "not found" answers included. */
export interface DictionaryCache {
  /** `undefined` when nothing (or nothing fresh) is remembered. */
  get(word: string): Promise<CachedLookup | undefined>;
  put(word: string, entry: DictionaryEntry | null): Promise<void>;
}

/** Words the signed-in learner saved. */
export interface SavedWordStore {
  list(userId: string): Promise<SavedWord[]>;
  has(userId: string, word: string): Promise<boolean>;
  /** Saving the same word again keeps one row. */
  save(userId: string, entry: DictionaryEntry): Promise<void>;
  remove(userId: string, word: string): Promise<void>;
}
