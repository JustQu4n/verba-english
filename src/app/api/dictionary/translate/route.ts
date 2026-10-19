import { NextResponse } from "next/server";

import { ValidationError } from "@/core/errors";
import { handle } from "@/lib/http";
import { translateWord } from "@/modules/dictionary/application/translate-word";
import { getContainer } from "@/server/container";

/** POST { "word": "convenient" }: the AI writes the meaning, the word is saved, one credit is spent. */
export const POST = handle(async (request: Request) => {
  const { auth, credits, translator, savedWords } = await getContainer();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError("invalid_word");
  }
  const word = typeof body === "object" && body !== null ? (body as { word?: unknown }).word : undefined;
  const result = await translateWord({ auth, credits, translator, savedWords }, word);
  return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
});
