import { NotFoundError } from "@/core/errors";
import { requireAdmin } from "@/modules/admin/application/require-admin";

import type { PromptAdminDeps } from "./prompt-admin-deps";
import { isPromptId } from "./prompt-input";

export async function deletePrompt(deps: PromptAdminDeps, id: string): Promise<void> {
  await requireAdmin(deps);
  const deleted = isPromptId(id) ? await deps.prompts.remove(id) : false;
  if (!deleted) throw new NotFoundError("Prompt not found");
}
