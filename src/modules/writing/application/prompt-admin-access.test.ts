import { describe, expect, it, vi } from "vitest";

import { ForbiddenError, UnauthorizedError } from "@/core/errors";
import { ADMIN_USER, fakeAuth, fakePromptRepo, fakeRoles } from "@/test/fakes";

import { createPrompt } from "./create-prompt";
import { deletePrompt } from "./delete-prompt";
import { getPrompt } from "./get-prompt";
import { listPrompts } from "./list-prompts";
import type { PromptAdminDeps } from "./prompt-admin-deps";
import { updatePrompt } from "./update-prompt";

const ID = "11111111-1111-4111-8111-111111111111";
const draft = { level: "beginner", category: "food-drink", vietnamese: "Xin chào.", hint: "hello" };

const operations: [string, (deps: PromptAdminDeps) => Promise<unknown>][] = [
  ["list", (deps) => listPrompts(deps, {})],
  ["get", (deps) => getPrompt(deps, ID)],
  ["create", (deps) => createPrompt(deps, draft)],
  ["update", (deps) => updatePrompt(deps, ID, draft)],
  ["delete", (deps) => deletePrompt(deps, ID)],
];

function depsFor(user: typeof ADMIN_USER | null, isAdmin: boolean): PromptAdminDeps {
  return {
    auth: fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue(user) }),
    roles: fakeRoles(isAdmin),
    prompts: fakePromptRepo(),
  };
}

describe.each(operations)("prompt admin access: %s", (_name, run) => {
  it("APR-AC-01: guests are rejected and the repository is not touched", async () => {
    const deps = depsFor(null, false);
    await expect(run(deps)).rejects.toBeInstanceOf(UnauthorizedError);
    for (const method of Object.values(deps.prompts)) expect(method).not.toHaveBeenCalled();
  });

  it("APR-AC-02: non-admins are rejected and the repository is not touched", async () => {
    const deps = depsFor(ADMIN_USER, false);
    await expect(run(deps)).rejects.toBeInstanceOf(ForbiddenError);
    for (const method of Object.values(deps.prompts)) expect(method).not.toHaveBeenCalled();
  });
});
