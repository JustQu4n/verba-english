import { describe, expect, it, vi } from "vitest";

import { ForbiddenError, UnauthorizedError, ValidationError } from "@/core/errors";
import { ADMIN_USER, fakeAuth, fakePromptRepo, fakeRoles } from "@/test/fakes";

import type { AnswerSuggester } from "./answer-suggester";
import { suggestAnswers } from "./suggest-answers";

const ANSWER = { text: "I go to work.", structureVi: "go to + nơi chốn", structureEn: "go to + place" };

function setup(options: { admin?: boolean; signedIn?: boolean; answers?: unknown[]; keywords?: string[] } = {}) {
  const { admin = true, signedIn = true, answers = [ANSWER], keywords = ["go to work"] } = options;
  const suggester: AnswerSuggester = { suggest: vi.fn().mockResolvedValue({ answers, keywords }) };
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
    await expect(suggestAnswers(deps, input)).resolves.toEqual({ answers: [ANSWER], keywords: ["go to work"] });
    expect(suggester.suggest).toHaveBeenCalledWith({ vietnamese: "Tôi đi làm.", level: "beginner", hint: "go to work" });
  });

  it("ANS-AC-11: at most three suggestions are returned and the hint is optional", async () => {
    const { suggester, deps } = setup({ answers: Array.from({ length: 5 }, () => ANSWER) });
    await expect(suggestAnswers(deps, { vietnamese: "Tôi đi làm.", level: "beginner" })).resolves.toMatchObject({ answers: [ANSWER, ANSWER, ANSWER] });
    expect(suggester.suggest).toHaveBeenCalledWith(expect.objectContaining({ hint: "" }));
  });

  it("ANS-AC-24: key words are cleaned (trimmed, no blanks or repeats) and capped at eight", async () => {
    const keywords = [" go ", "", "GO", "work", ...Array.from({ length: 10 }, (_, i) => `word${i}`)];
    const { deps } = setup({ keywords });
    const result = await suggestAnswers(deps, input);
    expect(result.keywords).toEqual(["go", "work", "word0", "word1", "word2", "word3", "word4", "word5"]);
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
