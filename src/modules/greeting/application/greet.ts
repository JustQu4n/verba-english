import { z } from "zod";

import { parseOrThrow } from "@/core/validate";

const greetSchema = z.object({
  name: z.string().trim().min(1, "Name must not be empty"),
});

export function greet(input: unknown): string {
  const { name } = parseOrThrow(greetSchema, input);
  return `Hello, ${name}!`;
}
