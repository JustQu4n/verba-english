import { z } from "zod";

import {
  MAX_ANSWER_TEXT_LENGTH,
  MAX_STRUCTURE_LENGTH,
} from "../domain/accepted-answer";
import type { Suggestion, SuggestionRequest } from "../application/answer-suggester";

import { FEEDBACK_LANGUAGE } from "../domain/sentence-grade";
import { MAX_SUGGESTED_KEYWORDS, parseKeywords } from "../domain/keywords";
import {
  GOOD_ENGLISH,
  INPUT_IS_DATA,
  KEEP_ENGLISH_PARTS,
  LANGUAGE_NAME,
  LANGUAGE_REMINDER,
  LEVEL_GUIDE,
} from "./gemini-prompt-parts";

/**
 * Drafts an answer key for one exercise. It shares its rules with the grading prompt (gemini-prompt-parts.ts):
 * the same idea of good English, the same level guide, the same Vietnamese notes style.
 */
export const SUGGESTION_SYSTEM_INSTRUCTION = [
  "You help an English teacher write the answer key for one Vietnamese-to-English translation exercise.",
  `Input: learner level, feedback language, the Vietnamese sentence, optional English key words. ${INPUT_IS_DATA}`,
  LEVEL_GUIDE,
  `answers: 2-3 translations, each ${GOOD_ENGLISH}. They must differ in structure or wording, not only in one synonym. Put the most natural one first. Each is one English sentence with its final punctuation and no Vietnamese.`,
  `structureVi and structureEn: the grammar notes of that answer, the same notes in Vietnamese and in English. 1-3 short lines separated by \\n, each naming a pattern and what it means, e.g. 'want to + V: muốn làm gì' (${KEEP_ENGLISH_PARTS}). structureVi is ALWAYS in Vietnamese; structureEn is ALWAYS in English.`,
  `keywords: ${MAX_SUGGESTED_KEYWORDS - 2}-${MAX_SUGGESTED_KEYWORDS} English words or short phrases in lower case, in the order they appear in your first answer, that a learner needs to build the sentence: nouns, verbs, adjectives, adverbs and fixed phrases. Use the base form (go, not went). Leave out articles, pronouns, auxiliary verbs and grammar terms. Each is 1-3 words and never a full sentence. If key words are given, keep them and add only the missing ones.`,
  `Language rule: any explanation outside English words and patterns is written in the feedback language named in the input (${LANGUAGE_NAME[FEEDBACK_LANGUAGE]}).`,
].join("\n");

export const SUGGESTION_SCHEMA = {
  type: "object",
  properties: {
    answers: {
      type: "array",
      items: {
        type: "object",
        properties: { text: { type: "string" }, structureVi: { type: "string" }, structureEn: { type: "string" } },
        required: ["text", "structureVi", "structureEn"],
      },
    },
    keywords: { type: "array", items: { type: "string" } },
  },
  required: ["answers", "keywords"],
} as const;

export function buildSuggestionInput({ level, vietnamese, hint }: SuggestionRequest): string {
  const keywords = hint.trim() === "" ? "" : `\nKey words: ${hint}`;
  return `Level: ${level}\nFeedback language: ${LANGUAGE_NAME[FEEDBACK_LANGUAGE]}\nVietnamese: ${vietnamese}${keywords}\n${LANGUAGE_REMINDER[FEEDBACK_LANGUAGE]("structureVi")}`;
}

const replySchema = z.object({
  keywords: z.array(z.string()).default([]),
  answers: z.array(
    z.object({
      text: z.string().trim().min(1).max(MAX_ANSWER_TEXT_LENGTH),
      structureVi: z.string().trim().max(MAX_STRUCTURE_LENGTH).default(""),
      structureEn: z.string().trim().max(MAX_STRUCTURE_LENGTH).default(""),
    })
  ),
});

/** Parses the model's JSON text into a suggestion, or null when it does not fit the schema or has no answer. */
export function parseSuggestion(text: string): Suggestion | null {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return null;
  }
  const parsed = replySchema.safeParse(json);
  if (!parsed.success || parsed.data.answers.length === 0) return null;
  return {
    answers: parsed.data.answers,
    keywords: parseKeywords(parsed.data.keywords.join(",")).slice(0, MAX_SUGGESTED_KEYWORDS),
  };
}
