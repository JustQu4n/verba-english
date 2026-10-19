import { connection } from "next/server";

import { UnauthorizedError } from "@/core/errors";
import { listSavedWords } from "@/modules/dictionary/application/saved-words";
import { getContainer } from "@/server/container";

import { SavedWordList } from "./saved-word-list";

/** The learner's saved words. Reads the session, so wrap it in <Suspense>. */
export async function VocabularyView() {
  await connection();
  const { auth, savedWords } = await getContainer();
  let words;
  try {
    words = await listSavedWords({ auth, savedWords });
  } catch (error) {
    // The dashboard gate already shows the sign-in screen; there is nothing to show.
    if (error instanceof UnauthorizedError) return null;
    throw error;
  }
  return <SavedWordList initial={words.map((w) => w.entry)} />;
}
