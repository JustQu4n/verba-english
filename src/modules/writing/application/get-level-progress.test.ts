import { describe, expect, it, vi } from "vitest";

import { UnauthorizedError, ValidationError } from "@/core/errors";
import { ADMIN_USER, fakeAuth, fakeProgress } from "@/test/fakes";

import { CATEGORIES } from "../domain/sentence-catalog";
import { getLevelProgress } from "./get-level-progress";

function deps(done: Record<string, number>, totals: Record<string, number>, signedIn = true) {
  const prompts = { list: vi.fn(), get: vi.fn(), countByCategory: vi.fn().mockResolvedValue(totals) };
  const progress = fakeProgress([], { completedByCategory: vi.fn().mockResolvedValue(done) });
  const auth = fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue(signedIn ? ADMIN_USER : null) });
  return { auth, prompts, progress };
}

describe("getLevelProgress", () => {
  it("SPG-AC-14: returns completed over published for every category of the level", async () => {
    const result = await getLevelProgress(deps({ "food-drink": 1 }, { "food-drink": 3, "everyday-life": 2 }), { level: "beginner" });
    expect(Object.keys(result).sort()).toEqual([...CATEGORIES].sort());
    expect(result["food-drink"]).toEqual({ completed: 1, total: 3 });
    expect(result["everyday-life"]).toEqual({ completed: 0, total: 2 });
    expect(result["health-medicine"]).toEqual({ completed: 0, total: 0 });
  });

  it("SPG-AC-14: completed never exceeds the published total", async () => {
    const result = await getLevelProgress(deps({ "food-drink": 5 }, { "food-drink": 3 }), { level: "beginner" });
    expect(result["food-drink"]).toEqual({ completed: 3, total: 3 });
  });

  it("SPG-AC-14: a guest is unauthorized and nothing is read", async () => {
    const d = deps({}, {}, false);
    await expect(getLevelProgress(d, { level: "beginner" })).rejects.toBeInstanceOf(UnauthorizedError);
    expect(d.prompts.countByCategory).not.toHaveBeenCalled();
    expect(d.progress.completedByCategory).not.toHaveBeenCalled();
  });

  it("SPG-AC-14: an invalid level is rejected before anything is read", async () => {
    const d = deps({}, {});
    await expect(getLevelProgress(d, { level: "expert" })).rejects.toBeInstanceOf(ValidationError);
    expect(d.prompts.countByCategory).not.toHaveBeenCalled();
  });
});
