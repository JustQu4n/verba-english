import type { ZodType } from "zod";

import { ValidationError } from "./errors";

export function parseOrThrow<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(
      result.error.issues[0]?.message ?? "Invalid data",
      result.error.issues
    );
  }
  return result.data;
}
