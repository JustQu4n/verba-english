import { describe, expect, it, vi } from "vitest";

import { NotFoundError, UnauthorizedError, ValidationError } from "@/core/errors";
import { fakeAuth, fakeProgress } from "@/test/fakes";

import type { SentencePrompt } from "../domain/sentence-catalog";
import { getNextSentence } from "./get-next-sentence";
import type { SentencePromptSource } from "./sentence-prompt-source";

const prompt = (id: string): SentencePrompt => ({
  id,
  level: "beginner",
  category: "food-drink",
  vietnamese: `Câu ${id}`,
  hint: `hint ${id}`,
});

const user = { id: "u1", email: "a@b.co" };
const selection = { level: "beginner", category: "food-drink" };

function setup(prompts: SentencePrompt[] = [prompt("a"), prompt("b"), prompt("c")], signedIn = true, done: string[] = []) {
  const source: SentencePromptSource = { list: vi.fn().mockResolvedValue(prompts), get: vi.fn(), countByCategory: vi.fn() };
  const progress = fakeProgress(done);
  const auth = fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue(signedIn ? user : null) });
  return { source, progress, deps: { auth, prompts: source, progress, random: () => 0 } };
}

describe("getNextSentence", () => {
  it("WSN-AC-04: asks the source for the chosen level and category and returns one of its prompts", async () => {
    const { source, deps } = setup();
    const result = await getNextSentence(deps, selection);
    expect(source.list).toHaveBeenCalledWith({ level: "beginner", category: "food-drink" });
    expect(result.prompt?.id).toBe("a");
  });

  it("WSN-AC-05: prefers prompts that were not seen yet", async () => {
    const { deps } = setup();
    const result = await getNextSentence(deps, { ...selection, seenIds: ["a", "b"] });
    expect(result.prompt?.id).toBe("c");
  });

  it("SPG-AC-05: allows repeats of unfinished prompts once every one was seen", async () => {
    const { deps } = setup();
    const result = await getNextSentence(deps, { ...selection, seenIds: ["a", "b", "c"] });
    expect(["a", "b", "c"]).toContain(result.prompt?.id);
  });

  it("WSN-AC-05: uses the random source to choose among the candidates", async () => {
    const { deps } = setup();
    const result = await getNextSentence({ ...deps, random: () => 0.99 }, selection);
    expect(result.prompt?.id).toBe("c");
  });

  it("SPG-AC-03: never returns a completed prompt, even when it is the only unseen one", async () => {
    const { deps, progress } = setup(undefined, true, ["a", "c"]);
    for (const seenIds of [[], ["b"], ["a", "b", "c"]]) {
      const result = await getNextSentence({ ...deps, random: () => 0.99 }, { ...selection, seenIds });
      expect(result.prompt?.id).toBe("b");
    }
    expect(progress.completedIds).toHaveBeenCalledWith("u1", { level: "beginner", category: "food-drink" });
  });

  it("SPG-AC-01: returns the progress of the pair", async () => {
    const { deps } = setup(undefined, true, ["a"]);
    await expect(getNextSentence(deps, selection)).resolves.toMatchObject({ progress: { completed: 1, total: 3 } });
  });

  it("SPG-AC-04: when every prompt is completed there is no prompt and no error", async () => {
    const { deps } = setup(undefined, true, ["a", "b", "c"]);
    await expect(getNextSentence(deps, selection)).resolves.toEqual({
      prompt: null,
      progress: { completed: 3, total: 3 },
    });
  });

  it.each<Record<string, string>>([
    { level: "expert", category: "food-drink" },
    { level: "beginner", category: "cooking" },
    { level: "", category: "" },
  ])("WSN-AC-06: rejects an invalid selection %j without querying the source", async (input) => {
    const { source, deps } = setup();
    await expect(getNextSentence(deps, input)).rejects.toBeInstanceOf(ValidationError);
    expect(source.list).not.toHaveBeenCalled();
  });

  it("WSN-AC-06: rejects a malformed seen list", async () => {
    const { deps } = setup();
    await expect(getNextSentence(deps, { ...selection, seenIds: "a" })).rejects.toBeInstanceOf(ValidationError);
  });

  it("WSN-AC-07: reports not found when the source has no prompt for the pair", async () => {
    const { deps } = setup([]);
    await expect(getNextSentence(deps, selection)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("WSN-AC-08: requires a signed-in user and does not query the source", async () => {
    const { source, progress, deps } = setup(undefined, false);
    await expect(getNextSentence(deps, selection)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(source.list).not.toHaveBeenCalled();
    expect(progress.completedIds).not.toHaveBeenCalled();
  });
});
