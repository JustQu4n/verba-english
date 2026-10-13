import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/core/errors";
import { ADMIN_USER, fakeAuth, fakePromptRepo, fakeRoles, samplePrompt } from "@/test/fakes";

import { getPrompt } from "./get-prompt";
import type { PromptRepository } from "./prompt-repository";

const ID = "11111111-1111-4111-8111-111111111111";
const depsWith = (prompts: PromptRepository) => ({
  auth: fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue(ADMIN_USER) }),
  roles: fakeRoles(true),
  prompts,
});

describe("getPrompt", () => {
  it("APR-AC-07: returns the prompt with that id", async () => {
    const prompts = fakePromptRepo({ findById: vi.fn().mockResolvedValue(samplePrompt({ id: ID })) });
    await expect(getPrompt(depsWith(prompts), ID)).resolves.toMatchObject({ id: ID });
    expect(prompts.findById).toHaveBeenCalledWith(ID);
  });

  it("APR-AC-07: reports not found when missing", async () => {
    const prompts = fakePromptRepo({ findById: vi.fn().mockResolvedValue(null) });
    await expect(getPrompt(depsWith(prompts), ID)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("APR-AC-07: reports not found for a malformed id without touching the repository", async () => {
    const prompts = fakePromptRepo();
    await expect(getPrompt(depsWith(prompts), "../etc")).rejects.toBeInstanceOf(NotFoundError);
    expect(prompts.findById).not.toHaveBeenCalled();
  });
});
