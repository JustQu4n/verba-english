import { describe, expect, it, vi } from "vitest";

import { UnauthorizedError, ValidationError } from "@/core/errors";
import { ADMIN_USER, fakeAuth, fakeProgress } from "@/test/fakes";

import type { SentencePrompt } from "../domain/sentence-catalog";
import { progressPercent } from "../domain/sentence-progress";
import { getSentenceProgress } from "./get-sentence-progress";

const p = (id: string): SentencePrompt => ({ id, level: "beginner", category: "food-drink", vietnamese: id, hint: id });
const selection = { level: "beginner", category: "food-drink" };

function deps(done: string[], signedIn = true) {
  const prompts = { list: vi.fn().mockResolvedValue([p("a"), p("b"), p("c"), p("d")]), get: vi.fn(), countByCategory: vi.fn() };
  const progress = fakeProgress(done);
  const auth = fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue(signedIn ? ADMIN_USER : null) });
  return { auth, prompts, progress };
}

describe("getSentenceProgress", () => {
  it("SPG-AC-01: counts completed prompts over the published ones", async () => {
    await expect(getSentenceProgress(deps(["a", "c"]), selection)).resolves.toEqual({ completed: 2, total: 4 });
  });

  it("SPG-AC-01: a completed prompt that is no longer published is not counted", async () => {
    await expect(getSentenceProgress(deps(["a", "gone"]), selection)).resolves.toEqual({ completed: 1, total: 4 });
  });

  it("SPG-AC-01: percent is rounded, capped, and 0 for an empty pair", () => {
    expect(progressPercent({ completed: 1, total: 3 })).toBe(33);
    expect(progressPercent({ completed: 4, total: 4 })).toBe(100);
    expect(progressPercent({ completed: 5, total: 4 })).toBe(100);
    expect(progressPercent({ completed: 0, total: 0 })).toBe(0);
  });

  it("SPG-AC-02: a guest is unauthorized and nothing is read", async () => {
    const d = deps([], false);
    await expect(getSentenceProgress(d, selection)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(d.prompts.list).not.toHaveBeenCalled();
    expect(d.progress.completedIds).not.toHaveBeenCalled();
  });

  it("SPG-AC-02: an invalid selection is rejected before anything is read", async () => {
    const d = deps([]);
    await expect(getSentenceProgress(d, { level: "expert", category: "food-drink" })).rejects.toBeInstanceOf(
      ValidationError
    );
    expect(d.prompts.list).not.toHaveBeenCalled();
  });
});
