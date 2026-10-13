import { describe, expect, it, vi } from "vitest";

import { ForbiddenError, UnauthorizedError, ValidationError } from "@/core/errors";
import { ADMIN_USER, fakeAuth, fakePromptRepo, fakeRoles } from "@/test/fakes";

import type { AnswerSuggester } from "./answer-suggester";
import { suggestAnswers } from "./suggest-answers";

const ANSWER = { text: "I go to work.", structureVi: "go to + nơi chốn", structureEn: "go to + place" };

function setup(options: { admin?: boolean; signedIn?: boolean; answers?: unknown[] } = {}) {
  const { admin = true, signedIn = true, answers = [ANSWER] } = options;
  const suggester: AnswerSuggester = { suggest: vi.fn().mockResolvedValue(answers) };
  const deps = {
    auth: fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue(signedIn ? ADMIN_USER : null) }),
    roles: fakeRoles(admin),
    prompts: fakePromptRepo(),
    suggester,
  };
  return { suggester, deps };
}

const input = { vietnamese: "  Tôi đi làm.  ", level: "beginner", hint: " go to work " };

describe("suggestAnswers", () => {
  it("ANS-AC-11: an admin gets the suggestions for the trimmed input", async () => {
    const { suggester, deps } = setup();
    await expect(suggestAnswers(deps, input)).resolves.toEqual([ANSWER]);
    expect(suggester.suggest).toHaveBeenCalledWith({ vietnamese: "Tôi đi làm.", level: "beginner", hint: "go to work" });
  });

  it("ANS-AC-11: at most three suggestions are returned and the hint is optional", async () => {
    const { suggester, deps } = setup({ answers: Array.from({ length: 5 }, () => ANSWER) });
    await expect(suggestAnswers(deps, { vietnamese: "Tôi đi làm.", level: "beginner" })).resolves.toHaveLength(3);
    expect(suggester.suggest).toHaveBeenCalledWith(expect.objectContaining({ hint: "" }));
  });

  it("ANS-AC-11: a guest or a non-admin is refused and the AI is not called", async () => {
    const guest = setup({ signedIn: false });
    await expect(suggestAnswers(guest.deps, input)).rejects.toBeInstanceOf(UnauthorizedError);
    const learner = setup({ admin: false });
    await expect(suggestAnswers(learner.deps, input)).rejects.toBeInstanceOf(ForbiddenError);
    expect(guest.suggester.suggest).not.toHaveBeenCalled();
    expect(learner.suggester.suggest).not.toHaveBeenCalled();
  });

  it("ANS-AC-11: invalid input is rejected before calling the AI", async () => {
    const { suggester, deps } = setup();
    for (const bad of [{ ...input, vietnamese: " " }, { ...input, level: "expert" }, { ...input, vietnamese: "a".repeat(301) }]) {
      await expect(suggestAnswers(deps, bad)).rejects.toBeInstanceOf(ValidationError);
    }
    expect(suggester.suggest).not.toHaveBeenCalled();
  });
});
