import { describe, expect, it, vi } from "vitest";

import { NotFoundError, ValidationError } from "@/core/errors";
import { ADMIN_USER, fakeAuth, fakePromptRepo, fakeRoles } from "@/test/fakes";

import type { PromptRepository } from "./prompt-repository";
import { updatePrompt } from "./update-prompt";

const ID = "11111111-1111-4111-8111-111111111111";
const valid = { level: "advanced", category: "law-justice", vietnamese: " Luật là luật. ", hint: "law", published: true };

const depsWith = (prompts: PromptRepository) => ({
  auth: fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue(ADMIN_USER) }),
  roles: fakeRoles(true),
  prompts,
});

describe("updatePrompt", () => {
  it("APR-AC-08: updates an existing prompt with trimmed data", async () => {
    const prompts = fakePromptRepo();
    const updated = await updatePrompt(depsWith(prompts), ID, valid);
    expect(prompts.update).toHaveBeenCalledWith(ID, {
      level: "advanced",
      category: "law-justice",
      vietnamese: "Luật là luật.",
      hint: "law",
      published: true,
    });
    expect(updated.published).toBe(true);
  });

  it("APR-AC-08: reports not found when the repository has no such prompt", async () => {
    const prompts = fakePromptRepo({ update: vi.fn().mockResolvedValue(null) });
    await expect(updatePrompt(depsWith(prompts), ID, valid)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("APR-AC-08: reports not found for a malformed id without touching the repository", async () => {
    const prompts = fakePromptRepo();
    await expect(updatePrompt(depsWith(prompts), "not-a-uuid", valid)).rejects.toBeInstanceOf(NotFoundError);
    expect(prompts.update).not.toHaveBeenCalled();
  });

  it("APR-AC-06: rejects invalid data and does not write", async () => {
    const prompts = fakePromptRepo();
    await expect(updatePrompt(depsWith(prompts), ID, { ...valid, hint: "" })).rejects.toBeInstanceOf(ValidationError);
    expect(prompts.update).not.toHaveBeenCalled();
  });
});
