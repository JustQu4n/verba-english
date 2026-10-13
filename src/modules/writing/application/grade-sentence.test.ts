import { describe, expect, it, vi } from "vitest";

import { InfrastructureError, InsufficientCreditsError, NotFoundError, UnauthorizedError, ValidationError } from "@/core/errors";
import { ADMIN_USER, fakeAuth, fakeCredits, fakeGrader, fakeProgress, sampleGrade } from "@/test/fakes";

import type { SentencePrompt } from "../domain/sentence-catalog";
import { MemoryGradeCache } from "../infrastructure/memory-grade-cache";
import { gradeSentence, type GradeSentenceDeps } from "./grade-sentence";
import type { SentencePromptSource } from "./sentence-prompt-source";

const ID = "11111111-1111-4111-8111-111111111111";
const prompt: SentencePrompt = {
  id: ID,
  level: "beginner",
  category: "transportation-travel",
  vietnamese: "Tôi muốn đi biển.",
  hint: "beach",
};

function deps(overrides: Partial<GradeSentenceDeps> = {}): GradeSentenceDeps {
  const prompts: SentencePromptSource = { list: vi.fn().mockResolvedValue([prompt]), get: vi.fn().mockResolvedValue(prompt) };
  return {
    auth: fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue(ADMIN_USER) }),
    prompts,
    credits: fakeCredits(100),
    grader: fakeGrader(),
    cache: new MemoryGradeCache(),
    progress: fakeProgress(),
    ...overrides,
  };
}

describe("gradeSentence", () => {
  it("AIG-AC-02: a guest is unauthorized and nothing else is touched", async () => {
    const d = deps({ auth: fakeAuth() });
    await expect(gradeSentence(d, { promptId: ID, answer: "I want" }, "vi")).rejects.toBeInstanceOf(UnauthorizedError);
    expect(d.prompts.get).not.toHaveBeenCalled();
    expect(d.grader.grade).not.toHaveBeenCalled();
    expect(d.credits.spend).not.toHaveBeenCalled();
  });

  it.each([
    { promptId: "nope", answer: "I want" },
    { promptId: ID, answer: "   " },
    { promptId: ID, answer: "a".repeat(301) },
    { promptId: ID },
    null,
  ])("AIG-AC-03: invalid input %j is rejected before anything is read", async (input) => {
    const d = deps();
    await expect(gradeSentence(d, input, "vi")).rejects.toBeInstanceOf(ValidationError);
    expect(d.prompts.get).not.toHaveBeenCalled();
    expect(d.grader.grade).not.toHaveBeenCalled();
    expect(d.credits.spend).not.toHaveBeenCalled();
  });

  it("AIG-AC-04: an unknown or unpublished prompt is not found and costs nothing", async () => {
    const d = deps({ prompts: { list: vi.fn(), get: vi.fn().mockResolvedValue(null) } });
    await expect(gradeSentence(d, { promptId: ID, answer: "I want" }, "vi")).rejects.toBeInstanceOf(NotFoundError);
    expect(d.grader.grade).not.toHaveBeenCalled();
    expect(d.credits.spend).not.toHaveBeenCalled();
  });

  it("AIG-AC-05: without enough credits the AI is not called", async () => {
    const d = deps({ credits: fakeCredits(0) });
    await expect(gradeSentence(d, { promptId: ID, answer: "I want" }, "vi")).rejects.toBeInstanceOf(InsufficientCreditsError);
    expect(d.grader.grade).not.toHaveBeenCalled();
    expect(d.credits.spend).not.toHaveBeenCalled();
  });

  it("AIG-AC-06: grades the stored sentence, then spends one credit for a wrong answer and returns the new balance", async () => {
    const grade = sampleGrade();
    const d = deps({ grader: fakeGrader(grade) });
    const result = await gradeSentence(d, { promptId: ID, answer: "  I want   to the beach " }, "vi");
    expect(result).toEqual({ grade, credits: 99, progress: null, points: null });
    expect(d.grader.grade).toHaveBeenCalledWith({
      vietnamese: "Tôi muốn đi biển.",
      level: "beginner",
      answer: "I want to the beach",
      language: "vi",
    });
    expect(d.credits.spend).toHaveBeenCalledWith(1);
  });

  it("AIG-AC-06: a correct answer is free: nothing is spent and the balance stays", async () => {
    const grade = sampleGrade({ correct: true, improvements: [] });
    const d = deps({ grader: fakeGrader(grade), credits: fakeCredits(40) });
    const result = await gradeSentence(d, { promptId: ID, answer: "I want to go to the beach." }, "vi");
    expect(result).toMatchObject({ grade, credits: 40 });
    expect(d.credits.spend).not.toHaveBeenCalled();
  });

  it("SPG-AC-06: a correct answer is recorded as completed and the new progress is returned", async () => {
    const progress = fakeProgress();
    vi.mocked(progress.completedIds).mockResolvedValueOnce(new Set([ID]));
    const prompts: SentencePromptSource = { list: vi.fn().mockResolvedValue([prompt, { ...prompt, id: "other" }]), get: vi.fn().mockResolvedValue(prompt) };
    const d = deps({ grader: fakeGrader(sampleGrade({ correct: true, improvements: [] })), progress, prompts });
    const result = await gradeSentence(d, { promptId: ID, answer: "I want to go to the beach." }, "vi");
    expect(progress.markCompleted).toHaveBeenCalledWith(ADMIN_USER.id, ID);
    expect(result.progress).toEqual({ completed: 1, total: 2 });
  });

  it("SPG-AC-06: a correct grade served from the cache is recorded too, for another user", async () => {
    const d = deps({ grader: fakeGrader(sampleGrade({ correct: true, improvements: [] })) });
    await gradeSentence(d, { promptId: ID, answer: "I want to go to the beach." }, "vi");
    const second = deps({ cache: d.cache, progress: fakeProgress() });
    const again = await gradeSentence(second, { promptId: ID, answer: "I want to go to the beach." }, "vi");
    expect(second.grader.grade).not.toHaveBeenCalled();
    expect(second.progress.markCompleted).toHaveBeenCalledWith(ADMIN_USER.id, ID);
    expect(again.progress).not.toBeNull();
  });

  it("PTS-AC-03: a correct answer returns the points earned and the new total", async () => {
    const progress = fakeProgress();
    vi.mocked(progress.markCompleted).mockResolvedValueOnce({ awarded: 10, totalPoints: 40 });
    const d = deps({ grader: fakeGrader(sampleGrade({ correct: true, improvements: [] })), progress });
    const result = await gradeSentence(d, { promptId: ID, answer: "I want to go to the beach." }, "vi");
    expect(result.points).toEqual({ earned: 10, total: 40 });
  });

  it("PTS-AC-03: a repeat completion earns nothing", async () => {
    const progress = fakeProgress();
    vi.mocked(progress.markCompleted).mockResolvedValueOnce({ awarded: 0, totalPoints: 40 });
    const d = deps({ grader: fakeGrader(sampleGrade({ correct: true, improvements: [] })), progress });
    const result = await gradeSentence(d, { promptId: ID, answer: "I want to go to the beach." }, "vi");
    expect(result.points).toEqual({ earned: 0, total: 40 });
  });

  it("PTS-AC-03: a wrong answer earns no points", async () => {
    const result = await gradeSentence(deps(), { promptId: ID, answer: "I want to the beach" }, "vi");
    expect(result.points).toBeNull();
  });

  it("SPG-AC-07: a wrong answer records nothing", async () => {
    const d = deps();
    const result = await gradeSentence(d, { promptId: ID, answer: "I want to the beach" }, "vi");
    expect(d.progress.markCompleted).not.toHaveBeenCalled();
    expect(result.progress).toBeNull();
  });

  it("SPG-AC-07: an AI failure records nothing", async () => {
    const d = deps({ grader: { grade: vi.fn().mockRejectedValue(new InfrastructureError("down")) } });
    await expect(gradeSentence(d, { promptId: ID, answer: "I want" }, "vi")).rejects.toBeInstanceOf(InfrastructureError);
    expect(d.progress.markCompleted).not.toHaveBeenCalled();
  });

  it("AIG-AC-06: every wrong attempt costs one credit, an edited retry included", async () => {
    const d = deps();
    await gradeSentence(d, { promptId: ID, answer: "I want to the beach" }, "vi");
    await gradeSentence(d, { promptId: ID, answer: "I want to the sea" }, "vi");
    expect(d.credits.spend).toHaveBeenCalledTimes(2);
  });

  it("AIG-AC-22: the feedback language goes to the grader and is part of the cache key", async () => {
    const d = deps();
    await gradeSentence(d, { promptId: ID, answer: "I want to the beach" }, "en");
    await gradeSentence(d, { promptId: ID, answer: "I want to the beach" }, "vi");
    await gradeSentence(d, { promptId: ID, answer: "I want to the beach" }, "en");
    expect(d.grader.grade).toHaveBeenCalledTimes(2);
    expect(d.grader.grade).toHaveBeenNthCalledWith(1, expect.objectContaining({ language: "en" }));
    expect(d.grader.grade).toHaveBeenNthCalledWith(2, expect.objectContaining({ language: "vi" }));
  });

  it("AIG-AC-07: an AI failure is an infrastructure error and nothing is spent", async () => {
    const d = deps({ grader: { grade: vi.fn().mockRejectedValue(new InfrastructureError("down")) } });
    await expect(gradeSentence(d, { promptId: ID, answer: "I want" }, "vi")).rejects.toBeInstanceOf(InfrastructureError);
    expect(d.credits.spend).not.toHaveBeenCalled();
  });

  it("AIG-AC-08: the same answer again (whitespace aside) comes from the cache for free", async () => {
    const d = deps();
    await gradeSentence(d, { promptId: ID, answer: "I want to the beach" }, "vi");
    const again = await gradeSentence(d, { promptId: ID, answer: " I want  to the beach " }, "vi");
    expect(again.grade).toEqual(sampleGrade());
    expect(d.grader.grade).toHaveBeenCalledTimes(1);
    expect(d.credits.spend).toHaveBeenCalledTimes(1);
  });

  it("AIG-AC-08: a different answer is graded again", async () => {
    const d = deps();
    await gradeSentence(d, { promptId: ID, answer: "I want to the beach" }, "vi");
    await gradeSentence(d, { promptId: ID, answer: "I want to go the beach" }, "vi");
    expect(d.grader.grade).toHaveBeenCalledTimes(2);
  });

  it("AIG-AC-09: if the balance ran out while the AI was working, the learner gets the error", async () => {
    const credits = fakeCredits(100, { spend: vi.fn().mockResolvedValue(null) });
    await expect(gradeSentence(deps({ credits }), { promptId: ID, answer: "I want" }, "vi")).rejects.toBeInstanceOf(
      InsufficientCreditsError
    );
  });
});
