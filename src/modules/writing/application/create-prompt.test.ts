import { describe, expect, it, vi } from "vitest";

import { ValidationError } from "@/core/errors";
import { ADMIN_USER, fakeAuth, fakePromptRepo, fakeRoles } from "@/test/fakes";

import { createPrompt } from "./create-prompt";

function setup() {
  const prompts = fakePromptRepo();
  const deps = {
    auth: fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue(ADMIN_USER) }),
    roles: fakeRoles(true),
    prompts,
  };
  return { prompts, deps };
}

const valid = { level: "intermediate", category: "work-business", vietnamese: "  Tôi đi làm.  ", hint: "  go to work ", published: undefined };

describe("createPrompt", () => {
  it("APR-AC-04: saves trimmed content as a draft by default", async () => {
    const { prompts, deps } = setup();
    const created = await createPrompt(deps, valid);
    expect(prompts.create).toHaveBeenCalledWith({
      level: "intermediate",
      category: "work-business",
      vietnamese: "Tôi đi làm.",
      hint: "go to work",
      published: false,
      answers: [],
    });
    expect(created.published).toBe(false);
  });

  it("APR-AC-05: saves as published when asked", async () => {
    const { prompts, deps } = setup();
    await createPrompt(deps, { ...valid, published: true });
    expect(prompts.create).toHaveBeenCalledWith(expect.objectContaining({ published: true }));
  });

  it.each<[string, Record<string, unknown>, string, string]>([
    ["empty sentence", { vietnamese: "   " }, "vietnamese", "vietnamese_required"],
    ["missing sentence", { vietnamese: undefined }, "vietnamese", "vietnamese_required"],
    ["sentence over 300", { vietnamese: "a".repeat(301) }, "vietnamese", "vietnamese_too_long"],
    ["empty hint", { hint: "" }, "hint", "hint_required"],
    ["hint over 200", { hint: "a".repeat(201) }, "hint", "hint_too_long"],
    ["unknown level", { level: "expert" }, "level", "level_invalid"],
    ["unknown category", { category: "cooking" }, "category", "category_invalid"],
  ])("APR-AC-06: rejects %s with a per-field code and does not write", async (_n, patch, field, code) => {
    const { prompts, deps } = setup();
    const error = await createPrompt(deps, { ...valid, ...patch }).catch((e) => e);
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: [field], message: code })])
    );
    expect(prompts.create).not.toHaveBeenCalled();
  });

  it("APR-AC-04: accepts the length limits exactly", async () => {
    const { deps } = setup();
    await expect(
      createPrompt(deps, { ...valid, vietnamese: "a".repeat(300), hint: "b".repeat(200) })
    ).resolves.toBeDefined();
  });

  const answer = { text: "  I go to work. ", structureVi: " go to + nơi chốn ", structureEn: "" };

  it("ANS-AC-09: answers are optional and trimmed; missing structures become empty", async () => {
    const { prompts, deps } = setup();
    await createPrompt(deps, { ...valid, answers: [{ text: answer.text, structureVi: answer.structureVi }] });
    expect(prompts.create).toHaveBeenCalledWith(
      expect.objectContaining({ answers: [{ text: "I go to work.", structureVi: "go to + nơi chốn", structureEn: "" }] })
    );
  });

  it.each<[string, unknown[], (string | number)[], string]>([
    ["more than five answers", Array.from({ length: 6 }, (_, i) => ({ text: `a${i}` })), ["answers"], "answers_too_many"],
    ["an empty answer", [{ text: "   " }], ["answers", 0, "text"], "answer_required"],
    ["an answer over 300", [{ text: "a".repeat(301) }], ["answers", 0, "text"], "answer_too_long"],
    ["a structure over 500", [{ text: "a", structureEn: "b".repeat(501) }], ["answers", 0, "structureEn"], "structure_too_long"],
  ])("ANS-AC-09: rejects %s and does not write", async (_n, answers, path, code) => {
    const { prompts, deps } = setup();
    const error = await createPrompt(deps, { ...valid, answers }).catch((e) => e);
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path, message: code })])
    );
    expect(prompts.create).not.toHaveBeenCalled();
  });

  it("ANS-AC-09: accepts five answers and the length limits exactly", async () => {
    const { deps } = setup();
    const edge = { text: "a".repeat(300), structureVi: "b".repeat(500), structureEn: "c".repeat(500) };
    await expect(createPrompt(deps, { ...valid, answers: Array.from({ length: 5 }, () => edge) })).resolves.toBeDefined();
  });
});
