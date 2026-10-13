import { z } from "zod";

import { UnauthorizedError } from "@/core/errors";
import { parseOrThrow } from "@/core/validate";
import type { AuthService } from "@/modules/auth/application/auth-service";

import type { AttemptRecord } from "../domain/attempt";
import type { AttemptStore } from "./attempt-store";

export const ATTEMPTS_PAGE_SIZE = 20;

/** Anything that is not a positive whole number falls back to the first page (the value comes from the URL). */
const toPage = (value: unknown) => {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isInteger(n) && n >= 1 ? n : 1;
};

const schema = z.object({ page: z.preprocess(toPage, z.number()) });

export interface AttemptList {
  items: AttemptRecord[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

/** The signed-in learner's attempts, newest first. */
export async function listAttempts(
  { auth, attempts }: { auth: AuthService; attempts: AttemptStore },
  input: unknown
): Promise<AttemptList> {
  const { page } = parseOrThrow(schema, input ?? {});
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError("You are not signed in");
  const { items, total } = await attempts.list(user.id, { offset: (page - 1) * ATTEMPTS_PAGE_SIZE, limit: ATTEMPTS_PAGE_SIZE });
  return { items, total, page, pageSize: ATTEMPTS_PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / ATTEMPTS_PAGE_SIZE)) };
}
