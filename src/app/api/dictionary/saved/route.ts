import { NextResponse } from "next/server";

import { ValidationError } from "@/core/errors";
import { handle } from "@/lib/http";
import { listSavedWords, removeWord, saveWord } from "@/modules/dictionary/application/saved-words";
import { getContainer } from "@/server/container";

const NO_STORE = { "Cache-Control": "private, no-store" };

export const GET = handle(async () => {
  const { auth, savedWords } = await getContainer();
  return NextResponse.json({ words: await listSavedWords({ auth, savedWords }) }, { headers: NO_STORE });
});

/** POST { "word": "beautiful" } saves the word; the content is read again on the server. */
export const POST = handle(async (request: Request) => {
  const { auth, dictionaryCache, dictionary, savedWords } = await getContainer();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError("invalid_word");
  }
  const word = typeof body === "object" && body !== null ? (body as { word?: unknown }).word : undefined;
  const entry = await saveWord({ auth, cache: dictionaryCache, provider: dictionary, savedWords }, word);
  return NextResponse.json({ entry, saved: true }, { headers: NO_STORE });
});

/** DELETE /api/dictionary/saved?word=beautiful */
export const DELETE = handle(async (request: Request) => {
  const { auth, savedWords } = await getContainer();
  await removeWord({ auth, savedWords }, new URL(request.url).searchParams.get("word"));
  return NextResponse.json({ saved: false }, { headers: NO_STORE });
});
