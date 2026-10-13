import { parseOrThrow } from "@/core/validate";
import { requireAdmin } from "@/modules/admin/application/require-admin";

import type { Prompt } from "../domain/prompt";
import type { PromptAdminDeps } from "./prompt-admin-deps";
import { promptInputSchema } from "./prompt-input";

export async function createPrompt(deps: PromptAdminDeps, input: unknown): Promise<Prompt> {
  await requireAdmin(deps);
  return deps.prompts.create(parseOrThrow(promptInputSchema, input));
}
