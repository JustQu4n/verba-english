import { UnauthorizedError } from "@/core/errors";
import { parseOrThrow } from "@/core/validate";
import type { AuthService } from "@/modules/auth/application/auth-service";

import { bareEntry, wordSchema, type DictionaryEntry, type SavedWord } from "../domain/dictionary-entry";
import type { SavedWordStore } from "./ports";
import { resolveEntry, type DictionaryDeps } from "./resolve-entry";

async function signedIn(auth: AuthService) {
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError("You are not signed in");
  return user;
}

/** Saves a word. Only the word comes from the browser; what is stored is read again from the cache or the dictionary. */
export async function saveWord(
  { auth, cache, provider, savedWords }: DictionaryDeps & { auth: AuthService; savedWords: SavedWordStore },
  input: unknown
): Promise<DictionaryEntry> {
  const user = await signedIn(auth);
  const word = parseOrThrow(wordSchema, input);
  const entry = await resolveEntry({ cache, provider }, word);
  // A word the dictionary does not know is saved on its own, so the learner can add the meaning later.
  const toSave = entry ?? bareEntry(word);
  await savedWords.save(user.id, toSave);
  return toSave;
}

export async function removeWord(
  { auth, savedWords }: { auth: AuthService; savedWords: SavedWordStore },
  input: unknown
): Promise<void> {
  const user = await signedIn(auth);
  await savedWords.remove(user.id, parseOrThrow(wordSchema, input));
}

/** The signed-in learner's saved words, newest first. */
export async function listSavedWords({ auth, savedWords }: { auth: AuthService; savedWords: SavedWordStore }): Promise<SavedWord[]> {
  const user = await signedIn(auth);
  return savedWords.list(user.id);
}
