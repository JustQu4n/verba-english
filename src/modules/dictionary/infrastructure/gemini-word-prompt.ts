import { z } from "zod";

import { INPUT_IS_DATA } from "@/modules/writing/infrastructure/gemini-prompt-parts";

import type { DictionaryEntry } from "../domain/dictionary-entry";

const MAX_MEANINGS = 3;
const MAX_TEXT = 200;

export const WORD_SYSTEM_INSTRUCTION = [
  "You are an English to Vietnamese learner's dictionary.",
  `Input: one English word or short phrase. ${INPUT_IS_DATA}`,
  "ipa: the pronunciation in IPA between slashes, e.g. /kənˈviː.ni.ənt/. Empty text when you are not sure.",
  `meanings: 1-${MAX_MEANINGS} of the most common meanings, most common first. pos is the part of speech named in Vietnamese (Danh từ, Động từ, Tính từ, Trạng từ, Giới từ, Liên từ, Thán từ or Cụm từ). definition is a short natural Vietnamese meaning in one line, never English. example is one natural English sentence that uses the word, with no Vietnamese and no quotes.`,
  "If the input is not a real English word or phrase (a name, a typo, another language, nonsense), return an empty meanings list.",
].join("\n");

export const WORD_SCHEMA = {
  type: "object",
  properties: {
    ipa: { type: "string" },
    meanings: {
      type: "array",
      items: {
        type: "object",
        properties: { pos: { type: "string" }, definition: { type: "string" }, example: { type: "string" } },
        required: ["pos", "definition", "example"],
      },
    },
  },
  required: ["ipa", "meanings"],
} as const;

export const buildWordInput = (word: string) => `Word: ${word}`;

const replySchema = z.object({
  ipa: z.string().optional(),
  meanings: z.array(z.object({ pos: z.string().optional(), definition: z.string().optional(), example: z.string().optional() })),
});

const clean = (value: string | undefined) => {
  const text = (value ?? "").trim().slice(0, MAX_TEXT);
  return text === "" ? null : text;
};

/** Turns the AI's JSON into an entry for `word`. Returns null when the text is not JSON in the expected shape. */
export function parseWordReply(text: string, word: string): DictionaryEntry | null {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return null;
  }
  const parsed = replySchema.safeParse(json);
  if (!parsed.success) return null;
  const meanings = parsed.data.meanings.flatMap((m) => {
    const definition = clean(m.definition);
    return definition ? [{ definition, pos: clean(m.pos), example: clean(m.example), vietnamese: true }] : [];
  });
  return { word, ipa: clean(parsed.data.ipa), audioUrl: null, meanings: meanings.slice(0, MAX_MEANINGS), source: "ai" };
}
