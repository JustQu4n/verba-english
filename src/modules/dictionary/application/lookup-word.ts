import { UnauthorizedError } from "@/core/errors";
import { parseOrThrow } from "@/core/validate";
import type { AuthService } from "@/modules/auth/application/auth-service";

import { wordSchema, type DictionaryEntry } from "../domain/dictionary-entry";
import type { SavedWordStore } from "./ports";
import { resolveEntry, type DictionaryDeps } from "./resolve-entry";

export interface LookupResult {
  entry: DictionaryEntry | null;
  /** The signed-in learner already saved this word. */
  saved: boolean;
}

/** Looks a word up for the signed-in learner: cache, then the dictionary service. */
export async function lookupWord(
  { auth, cache, provider, savedWords }: DictionaryDeps & { auth: AuthService; savedWords: SavedWordStore },
  input: unknown
): Promise<LookupResult> {
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError("You are not signed in");
  const word = parseOrThrow(wordSchema, input);
  const entry = await resolveEntry({ cache, provider }, word);
  // A word the dictionary does not know can still be saved, so the answer says whether it already is.
  return { entry, saved: await savedWords.has(user.id, entry?.word ?? word) };
}
