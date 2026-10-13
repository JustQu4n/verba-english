import { z } from "zod";

import { parseOrThrow } from "@/core/validate";
import { requireAdmin } from "@/modules/admin/application/require-admin";

import type { Prompt } from "../domain/prompt";
import { CATEGORIES, LEVELS } from "../domain/sentence-catalog";
import type { PromptAdminDeps } from "./prompt-admin-deps";

export const PAGE_SIZE = 20;
const MAX_QUERY_LENGTH = 100;

/** Query-string values arrive as strings, and an empty form field means "not set". */
const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

/** Anything that is not a positive whole number falls back to the first page. */
const toPage = (value: unknown) => {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isInteger(n) && n >= 1 ? n : 1;
};

const listSchema = z.object({
  level: z.preprocess(emptyToUndefined, z.enum(LEVELS).optional()),
  category: z.preprocess(emptyToUndefined, z.enum(CATEGORIES).optional()),
  status: z.preprocess(emptyToUndefined, z.enum(["all", "published", "draft"]).default("all")),
  query: z.preprocess(emptyToUndefined, z.string().trim().max(MAX_QUERY_LENGTH).optional()),
  page: z.preprocess(toPage, z.number()),
});

export interface PromptList {
  items: Prompt[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export async function listPrompts(deps: PromptAdminDeps, input: unknown): Promise<PromptList> {
  await requireAdmin(deps);
  const { level, category, status, query, page } = parseOrThrow(listSchema, input);
  const { items, total } = await deps.prompts.list({ level, category, status, query, page, pageSize: PAGE_SIZE });
  return { items, total, page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
