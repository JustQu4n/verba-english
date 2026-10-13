"use server";

import { unstable_rethrow } from "next/navigation";

import { NotFoundError, UnauthorizedError } from "@/core/errors";
import { getNextSentence } from "@/modules/writing/application/get-next-sentence";
import type { SentencePrompt } from "@/modules/writing/domain/sentence-catalog";
import { getContainer } from "@/server/container";

export type NextSentenceResult =
  | { status: "ok"; prompt: SentencePrompt }
  | { status: "error"; reason: "unauthorized" | "not_found" | "unknown" };

/** Returns the next practice sentence for the chosen level and category. */
export async function nextSentence(input: unknown): Promise<NextSentenceResult> {
  try {
    const { auth, sentencePrompts } = await getContainer();
    return { status: "ok", prompt: await getNextSentence({ auth, prompts: sentencePrompts }, input) };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { status: "error", reason: "unauthorized" };
    if (error instanceof NotFoundError) return { status: "error", reason: "not_found" };
    unstable_rethrow(error);
    console.error(error);
    return { status: "error", reason: "unknown" };
  }
}
