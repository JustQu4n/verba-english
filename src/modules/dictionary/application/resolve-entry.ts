import type { DictionaryEntry } from "../domain/dictionary-entry";
import type { DictionaryCache, DictionaryProvider } from "./ports";

export interface DictionaryDeps {
  cache: DictionaryCache;
  provider: DictionaryProvider;
}

// Lookups running right now in this server instance: two learners asking for the same new word share one call.
const inFlight = new Map<string, Promise<DictionaryEntry | null>>();

async function fetchAndRemember({ cache, provider }: DictionaryDeps, word: string): Promise<DictionaryEntry | null> {
  const found = await provider.lookup(word);
  const entry = found ? { ...found, word } : null;
  try {
    // A word the dictionary does not know is remembered too, for a short time, so it is not asked for again and again.
    await cache.put(word, entry);
  } catch (error) {
    console.error("Dictionary cache write failed", error);
  }
  return entry;
}

/**
 * Cache first, then the dictionary service. The cache is only a shortcut: when it fails the word is
 * still looked up, and a result that cannot be stored is still returned. A service failure is never cached.
 */
export async function resolveEntry(deps: DictionaryDeps, word: string): Promise<DictionaryEntry | null> {
  try {
    const cached = await deps.cache.get(word);
    if (cached) return cached.entry;
  } catch (error) {
    console.error("Dictionary cache read failed", error);
  }
  const running = inFlight.get(word);
  if (running) return running;
  const started = fetchAndRemember(deps, word).finally(() => inFlight.delete(word));
  inFlight.set(word, started);
  return started;
}
