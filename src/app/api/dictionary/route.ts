import { NextResponse } from "next/server";

import { handle } from "@/lib/http";
import { lookupWord } from "@/modules/dictionary/application/lookup-word";
import { getContainer } from "@/server/container";

/** GET /api/dictionary?word=beautiful: cache first, then the dictionary service. */
export const GET = handle(async (request: Request) => {
  const { auth, dictionaryCache, dictionary, savedWords } = await getContainer();
  const word = new URL(request.url).searchParams.get("word");
  const result = await lookupWord({ auth, cache: dictionaryCache, provider: dictionary, savedWords }, word);
  return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
});
