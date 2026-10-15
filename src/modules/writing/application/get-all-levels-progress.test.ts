import { describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/core/errors";
import { ADMIN_USER, fakeAuth, fakeProgress } from "@/test/fakes";

import { CATEGORIES, LEVELS } from "../domain/sentence-catalog";
import { getAllLevelsProgress } from "./get-all-levels-progress";

function deps(doneByLevel: Record<string, Record<string, number>>, totals: Record<string, number>, signedIn = true) {
  const prompts = { list: vi.fn(), get: vi.fn(), countByCategory: vi.fn().mockResolvedValue(totals) };
  const progress = fakeProgress([], {
    completedByCategory: vi.fn().mockImplementation((_user: string, level: string) => Promise.resolve(doneByLevel[level] ?? {})),
  });
  const getCurrentUser = vi.fn().mockResolvedValue(signedIn ? ADMIN_USER : null);
  return { auth: fakeAuth({ getCurrentUser }), prompts, progress, getCurrentUser };
}

describe("getAllLevelsProgress", () => {
  it("SPG-AC-14: returns completed over published for every category of every level", async () => {
    const d = deps({ beginner: { "food-drink": 1 }, advanced: { "food-drink": 2 } }, { "food-drink": 3, "everyday-life": 2 });
    const result = await getAllLevelsProgress(d);
    expect(Object.keys(result).sort()).toEqual([...LEVELS].sort());
    for (const level of LEVELS) expect(Object.keys(result[level]).sort()).toEqual([...CATEGORIES].sort());
    expect(result.beginner["food-drink"]).toEqual({ completed: 1, total: 3 });
    expect(result.advanced["food-drink"]).toEqual({ completed: 2, total: 3 });
    expect(result.intermediate["everyday-life"]).toEqual({ completed: 0, total: 2 });
    expect(result.beginner["health-medicine"]).toEqual({ completed: 0, total: 0 });
  });

  it("SPG-AC-14: completed never exceeds the published total", async () => {
    const result = await getAllLevelsProgress(deps({ beginner: { "food-drink": 5 } }, { "food-drink": 3 }));
    expect(result.beginner["food-drink"]).toEqual({ completed: 3, total: 3 });
  });

  it("SPG-AC-14: checks the session once for all three levels", async () => {
    const d = deps({}, {});
    await getAllLevelsProgress(d);
    expect(d.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(d.prompts.countByCategory).toHaveBeenCalledTimes(LEVELS.length);
  });

  it("SPG-AC-14: a guest is unauthorized and nothing is read", async () => {
    const d = deps({}, {}, false);
    await expect(getAllLevelsProgress(d)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(d.prompts.countByCategory).not.toHaveBeenCalled();
    expect(d.progress.completedByCategory).not.toHaveBeenCalled();
  });
});
