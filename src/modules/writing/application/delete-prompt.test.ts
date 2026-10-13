import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/core/errors";
import { ADMIN_USER, fakeAuth, fakePromptRepo, fakeRoles } from "@/test/fakes";

import { deletePrompt } from "./delete-prompt";
import type { PromptRepository } from "./prompt-repository";

const ID = "11111111-1111-4111-8111-111111111111";
const depsWith = (prompts: PromptRepository) => ({
  auth: fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue(ADMIN_USER) }),
  roles: fakeRoles(true),
  prompts,
});

describe("deletePrompt", () => {
  it("APR-AC-09: deletes an existing prompt", async () => {
    const prompts = fakePromptRepo();
    await deletePrompt(depsWith(prompts), ID);
    expect(prompts.remove).toHaveBeenCalledWith(ID);
  });

  it("APR-AC-09: reports not found when nothing was deleted", async () => {
    const prompts = fakePromptRepo({ remove: vi.fn().mockResolvedValue(false) });
    await expect(deletePrompt(depsWith(prompts), ID)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("APR-AC-09: reports not found for a malformed id without touching the repository", async () => {
    const prompts = fakePromptRepo();
    await expect(deletePrompt(depsWith(prompts), "1; drop table prompts")).rejects.toBeInstanceOf(NotFoundError);
    expect(prompts.remove).not.toHaveBeenCalled();
  });
});
