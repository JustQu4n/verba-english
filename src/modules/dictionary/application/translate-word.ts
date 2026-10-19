import { InsufficientCreditsError, NotFoundError, UnauthorizedError } from "@/core/errors";
import { parseOrThrow } from "@/core/validate";
import type { AuthService } from "@/modules/auth/application/auth-service";
import type { CreditStore } from "@/modules/credits/application/credit-store";
import { TRANSLATE_COST } from "@/modules/credits/domain/credits";

import { wordSchema, type DictionaryEntry } from "../domain/dictionary-entry";
import type { SavedWordStore, WordTranslator } from "./ports";

export interface TranslateWordDeps {
  auth: AuthService;
  credits: CreditStore;
  translator: WordTranslator;
  savedWords: SavedWordStore;
}

export interface TranslateWordResult {
  entry: DictionaryEntry;
  /** Balance after this call. */
  credits: number;
}

/**
 * Translates a word with the AI and saves it, replacing what was saved for that word.
 * Like grading, the balance is checked BEFORE the AI is called and credit is taken only AFTER it answered with
 * something usable, so a failing AI or a text that is not a word never costs the learner anything.
 */
export async function translateWord(
  { auth, credits, translator, savedWords }: TranslateWordDeps,
  input: unknown
): Promise<TranslateWordResult> {
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError("You are not signed in");
  const word = parseOrThrow(wordSchema, input);

  if ((await credits.balance(user.id)) < TRANSLATE_COST) throw new InsufficientCreditsError("Not enough credits");

  const translated = await translator.translate(word);
  if (translated.meanings.length === 0) throw new NotFoundError("cannot_translate");
  const entry: DictionaryEntry = { ...translated, word, source: "ai" };

  const previous = (await savedWords.list(user.id)).find((saved) => saved.entry.word === word)?.entry;
  await savedWords.save(user.id, entry);
  const remaining = await credits.spend(TRANSLATE_COST);
  if (remaining === null) {
    // Lost a race for the last credit: put back what was there, so the word is not translated for free.
    if (previous) await savedWords.save(user.id, previous);
    else await savedWords.remove(user.id, word);
    throw new InsufficientCreditsError("Not enough credits");
  }
  return { entry, credits: remaining };
}
