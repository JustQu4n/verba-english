import { describe, expect, it } from "vitest";

import { sampleGrade } from "@/test/fakes";

import { MemoryGradeCache } from "./memory-grade-cache";

describe("MemoryGradeCache", () => {
  it("AIG-AC-16: returns what was stored", () => {
    const cache = new MemoryGradeCache();
    cache.set("a", sampleGrade());
    expect(cache.get("a")).toEqual(sampleGrade());
    expect(cache.get("b")).toBeUndefined();
  });

  it("AIG-AC-16: drops the least recently used entry past the limit", () => {
    const cache = new MemoryGradeCache({ maxEntries: 2 });
    cache.set("a", sampleGrade({ comment: "a" }));
    cache.set("b", sampleGrade({ comment: "b" }));
    cache.get("a"); // a is now the most recently used
    cache.set("c", sampleGrade({ comment: "c" }));
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")?.comment).toBe("a");
    expect(cache.get("c")?.comment).toBe("c");
  });

  it("AIG-AC-16: forgets entries after the time to live", () => {
    let now = 1_000;
    const cache = new MemoryGradeCache({ ttlMs: 100, now: () => now });
    cache.set("a", sampleGrade());
    now = 1_099;
    expect(cache.get("a")).toBeDefined();
    now = 1_100;
    expect(cache.get("a")).toBeUndefined();
  });

  it("AIG-AC-16: storing the same key again refreshes it", () => {
    const cache = new MemoryGradeCache({ maxEntries: 2 });
    cache.set("a", sampleGrade({ comment: "old" }));
    cache.set("b", sampleGrade());
    cache.set("a", sampleGrade({ comment: "new" }));
    cache.set("c", sampleGrade());
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")?.comment).toBe("new");
  });
});
