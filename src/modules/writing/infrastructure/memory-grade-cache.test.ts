import { describe, expect, it } from "vitest";

import { sampleGrade } from "@/test/fakes";

import { MemoryGradeCache } from "./memory-grade-cache";

describe("MemoryGradeCache", () => {
  it("AIG-AC-16: returns what was stored", async () => {
    const cache = new MemoryGradeCache();
    await cache.set("a", sampleGrade());
    expect(await cache.get("a")).toEqual(sampleGrade());
    expect(await cache.get("b")).toBeUndefined();
  });

  it("AIG-AC-16: drops the least recently used entry past the limit", async () => {
    const cache = new MemoryGradeCache({ maxEntries: 2 });
    await cache.set("a", sampleGrade({ comment: "a" }));
    await cache.set("b", sampleGrade({ comment: "b" }));
    await cache.get("a"); // a is now the most recently used
    await cache.set("c", sampleGrade({ comment: "c" }));
    expect(await cache.get("b")).toBeUndefined();
    expect((await cache.get("a"))?.comment).toBe("a");
    expect((await cache.get("c"))?.comment).toBe("c");
  });

  it("AIG-AC-16: forgets entries after the time to live", async () => {
    let now = 1_000;
    const cache = new MemoryGradeCache({ ttlMs: 100, now: () => now });
    await cache.set("a", sampleGrade());
    now = 1_099;
    expect(await cache.get("a")).toBeDefined();
    now = 1_100;
    expect(await cache.get("a")).toBeUndefined();
  });

  it("AIG-AC-16: storing the same key again refreshes it", async () => {
    const cache = new MemoryGradeCache({ maxEntries: 2 });
    await cache.set("a", sampleGrade({ comment: "old" }));
    await cache.set("b", sampleGrade());
    await cache.set("a", sampleGrade({ comment: "new" }));
    await cache.set("c", sampleGrade());
    expect(await cache.get("b")).toBeUndefined();
    expect((await cache.get("a"))?.comment).toBe("new");
  });
});
