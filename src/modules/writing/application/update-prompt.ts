import { NotFoundError } from "@/core/errors";
import { parseOrThrow } from "@/core/validate";
import { requireAdmin } from "@/modules/admin/application/require-admin";

import type { Prompt } from "../domain/prompt";
import type { PromptAdminDeps } from "./prompt-admin-deps";
import { isPromptId, promptInputSchema } from "./prompt-input";

export async function updatePrompt(deps: PromptAdminDeps, id: string, input: unknown): Promise<Prompt> {
  await requireAdmin(deps);
  const draft = parseOrThrow(promptInputSchema, input);
  const updated = isPromptId(id) ? await deps.prompts.update(id, draft) : null;
  if (!updated) throw new NotFoundError("Prompt not found");
  return updated;
}
