import { NotFoundError } from "@/core/errors";
import { requireAdmin } from "@/modules/admin/application/require-admin";

import type { Prompt } from "../domain/prompt";
import type { PromptAdminDeps } from "./prompt-admin-deps";
import { isPromptId } from "./prompt-input";

export async function getPrompt(deps: PromptAdminDeps, id: string): Promise<Prompt> {
  await requireAdmin(deps);
  const prompt = isPromptId(id) ? await deps.prompts.findById(id) : null;
  if (!prompt) throw new NotFoundError("Prompt not found");
  return prompt;
}
