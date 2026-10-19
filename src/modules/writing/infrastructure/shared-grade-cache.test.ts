import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { InfrastructureError } from "@/core/errors";
import { sampleGrade } from "@/test/fakes";

import { LayeredGradeCache } from "./layered-grade-cache";
import { MemoryGradeCache } from "./memory-grade-cache";
import { GRADE_TTL_MS, SupabaseGradeCache } from "./supabase-grade-cache";

type Result = { data: unknown; error: unknown };

function builder(result: Result) {
  const b: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const name of ["select", "eq", "gt", "lt", "upsert", "delete"]) b[name] = vi.fn(() => b);
  b.maybeSingle = vi.fn(async () => result);
  (b as unknown as { then: unknown }).then = (resolve: (value: Result) => unknown) => Promise.resolve(result).then(resolve);
  return b;
}

const NOW = new Date("2026-10-19T00:00:00Z").getTime();
const sha = (text: string) => createHash("sha256").update(text).digest("hex");

function sharedCache(result: Result, random = 0.5) {
  const b = builder(result);
  const client = { from: vi.fn(() => b) } as unknown as SupabaseClient;
  return { cache: new SupabaseGradeCache(() => client, () => NOW, () => random), b, client };
}

describe("SupabaseGradeCache", () => {
  it("AIG-AC-30: reads a live grade by the hash of the key, never by the learner's text", async () => {
    const { cache, b } = sharedCache({ data: { grade: sampleGrade() }, error: null });
    await expect(cache.get("vi\u0000p1\u0000my secret answer")).resolves.toEqual(sampleGrade());
    expect(b.eq).toHaveBeenCalledWith("key", sha("vi\u0000p1\u0000my secret answer"));
    expect(b.gt).toHaveBeenCalledWith("expires_at", new Date(NOW).toISOString());
  });

  it("AIG-AC-30: a missing or damaged row is a miss", async () => {
    await expect(sharedCache({ data: null, error: null }).cache.get("k")).resolves.toBeUndefined();
    await expect(sharedCache({ data: { grade: { correct: "yes" } }, error: null }).cache.get("k")).resolves.toBeUndefined();
  });

  it("AIG-AC-30: writes with an upsert that expires in 24 hours", async () => {
    const { cache, b } = sharedCache({ data: null, error: null });
    await cache.set("k", sampleGrade());
    expect(b.upsert).toHaveBeenCalledWith(
      { key: sha("k"), grade: sampleGrade(), expires_at: new Date(NOW + GRADE_TTL_MS).toISOString() },
      { onConflict: "key" }
    );
    expect(b.delete).not.toHaveBeenCalled();
  });

  it("AIG-AC-30: now and then a write also deletes expired rows", async () => {
    const { cache, b } = sharedCache({ data: null, error: null }, 0.01);
    await cache.set("k", sampleGrade());
    expect(b.delete).toHaveBeenCalled();
    expect(b.lt).toHaveBeenCalledWith("expires_at", new Date(NOW).toISOString());
  });

  it("AIG-AC-30: database errors and a missing service key are infrastructure errors without the original message", async () => {
    const { cache } = sharedCache({ data: null, error: { message: "relation secret missing" } });
    const read = cache.get("k");
    await expect(read).rejects.toBeInstanceOf(InfrastructureError);
    await expect(read).rejects.not.toThrow(/secret/);
    await expect(cache.set("k", sampleGrade())).rejects.toBeInstanceOf(InfrastructureError);
    const noKey = new SupabaseGradeCache(() => {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    });
    const missing = noKey.get("k");
    await expect(missing).rejects.toBeInstanceOf(InfrastructureError);
    await expect(missing).rejects.not.toThrow(/SERVICE_ROLE/);
  });
});

describe("LayeredGradeCache", () => {
  it("AIG-AC-30: a hit in the shared cache is copied to the fast one, which then answers alone", async () => {
    const fast = new MemoryGradeCache();
    const shared = new MemoryGradeCache();
    await shared.set("k", sampleGrade());
    const spy = vi.spyOn(shared, "get");
    const layered = new LayeredGradeCache(fast, shared);
    await expect(layered.get("k")).resolves.toEqual(sampleGrade());
    await expect(layered.get("k")).resolves.toEqual(sampleGrade());
    expect(spy).toHaveBeenCalledTimes(1);
    await expect(layered.get("other")).resolves.toBeUndefined();
  });

  it("AIG-AC-30: writes go to both caches", async () => {
    const fast = new MemoryGradeCache();
    const shared = new MemoryGradeCache();
    await new LayeredGradeCache(fast, shared).set("k", sampleGrade());
    expect(await fast.get("k")).toEqual(sampleGrade());
    expect(await shared.get("k")).toEqual(sampleGrade());
  });
});
