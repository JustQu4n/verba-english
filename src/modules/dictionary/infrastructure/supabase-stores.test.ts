import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { InfrastructureError } from "@/core/errors";
import { sampleEntry } from "@/test/fakes";

import { SupabaseDictionaryCache } from "./supabase-dictionary-cache";
import { SupabaseSavedWordStore } from "./supabase-saved-word-store";

type Result = { data: unknown; error: unknown };

/** A query builder that is awaitable, and also answers `.maybeSingle()` and `.returns()`. */
function builder(result: Result) {
  const b: Record<string, unknown> = {};
  for (const name of ["select", "eq", "order", "upsert", "delete", "returns", "or"]) b[name] = vi.fn(() => b);
  b.maybeSingle = vi.fn(async () => result);
  b.then = (resolve: (value: Result) => unknown) => Promise.resolve(result).then(resolve);
  return b as Record<string, ReturnType<typeof vi.fn>> & { then: unknown };
}

function clientFor(result: Result) {
  const b = builder(result);
  const from = vi.fn(() => b);
  return { client: { from } as unknown as SupabaseClient, from, b };
}

const NOW = new Date("2026-10-19T00:00:00Z").getTime();
const day = 86_400_000;

describe("SupabaseDictionaryCache", () => {
  it("DIC-AC-10: reads a fresh entry by word", async () => {
    const { client, from, b } = clientFor({ data: { entry: sampleEntry(), fetched_at: new Date(NOW - 2 * day).toISOString() }, error: null });
    await expect(new SupabaseDictionaryCache(() => client, () => NOW).get("convenient")).resolves.toEqual({ entry: sampleEntry() });
    expect(from).toHaveBeenCalledWith("dictionary_cache");
    expect(b.eq).toHaveBeenCalledWith("word", "convenient");
  });

  it("DIC-AC-10: ignores a missing, stale or damaged entry", async () => {
    const stale = clientFor({ data: { entry: sampleEntry(), fetched_at: new Date(NOW - 31 * day).toISOString() }, error: null });
    await expect(new SupabaseDictionaryCache(() => stale.client, () => NOW).get("x")).resolves.toBeUndefined();
    const none = clientFor({ data: null, error: null });
    await expect(new SupabaseDictionaryCache(() => none.client, () => NOW).get("x")).resolves.toBeUndefined();
    const bad = clientFor({ data: { entry: { nope: 1 }, fetched_at: new Date(NOW).toISOString() }, error: null });
    await expect(new SupabaseDictionaryCache(() => bad.client, () => NOW).get("x")).resolves.toBeUndefined();
  });

  it("DIC-AC-20: a \"not found\" answer is kept for an hour only", async () => {
    const fresh = clientFor({ data: { entry: null, fetched_at: new Date(NOW - 59 * 60_000).toISOString() }, error: null });
    await expect(new SupabaseDictionaryCache(() => fresh.client, () => NOW).get("x")).resolves.toEqual({ entry: null });
    const old = clientFor({ data: { entry: null, fetched_at: new Date(NOW - 61 * 60_000).toISOString() }, error: null });
    await expect(new SupabaseDictionaryCache(() => old.client, () => NOW).get("x")).resolves.toBeUndefined();
  });

  it("DIC-AC-10: writes with an upsert on the word, a null entry for an unknown word", async () => {
    const { client, b } = clientFor({ data: null, error: null });
    const cache = new SupabaseDictionaryCache(() => client, () => NOW, () => 0.5);
    await cache.put("convenient", sampleEntry());
    expect(b.upsert).toHaveBeenCalledWith({ word: "convenient", entry: sampleEntry(), fetched_at: new Date(NOW).toISOString() }, { onConflict: "word" });
    await cache.put("zzzz", null);
    expect(b.upsert).toHaveBeenLastCalledWith({ word: "zzzz", entry: null, fetched_at: new Date(NOW).toISOString() }, { onConflict: "word" });
    expect(b.delete).not.toHaveBeenCalled();
  });

  it("DIC-AC-22: now and then a write also deletes expired rows", async () => {
    const { client, b } = clientFor({ data: null, error: null });
    await new SupabaseDictionaryCache(() => client, () => NOW, () => 0.01).put("a", sampleEntry());
    expect(b.delete).toHaveBeenCalled();
    const [filter] = b.or.mock.calls[0];
    expect(filter).toContain(`fetched_at.lt.${new Date(NOW - 30 * day).toISOString()}`);
    expect(filter).toContain(`and(entry.is.null,fetched_at.lt.${new Date(NOW - 60 * 60_000).toISOString()})`);
  });

  it("DIC-AC-10: database errors and a missing service key are infrastructure errors without the original message", async () => {
    const { client } = clientFor({ data: null, error: { message: "relation secret_table missing" } });
    const cache = new SupabaseDictionaryCache(() => client);
    const read = cache.get("x");
    await expect(read).rejects.toBeInstanceOf(InfrastructureError);
    await expect(read).rejects.not.toThrow(/secret_table/);
    await expect(cache.put("x", sampleEntry())).rejects.toBeInstanceOf(InfrastructureError);

    const noKey = new SupabaseDictionaryCache(() => {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    });
    const missing = noKey.get("x");
    await expect(missing).rejects.toBeInstanceOf(InfrastructureError);
    await expect(missing).rejects.not.toThrow(/SERVICE_ROLE/);
  });
});

describe("SupabaseSavedWordStore", () => {
  it("DIC-AC-10: lists the learner's words newest first and skips damaged rows", async () => {
    const rows = [
      { entry: sampleEntry(), created_at: "2026-10-02T00:00:00Z" },
      { entry: { broken: true }, created_at: "2026-10-01T00:00:00Z" },
    ];
    const { client, from, b } = clientFor({ data: rows, error: null });
    const list = await new SupabaseSavedWordStore(client).list("u1");
    expect(list).toEqual([{ entry: sampleEntry(), savedAt: new Date("2026-10-02T00:00:00Z") }]);
    expect(from).toHaveBeenCalledWith("saved_words");
    expect(b.eq).toHaveBeenCalledWith("user_id", "u1");
    expect(b.order).toHaveBeenCalledWith("created_at", { ascending: false });
    const empty = clientFor({ data: null, error: null });
    await expect(new SupabaseSavedWordStore(empty.client).list("u1")).resolves.toEqual([]);
  });

  it("DIC-AC-10: tells whether a word is saved", async () => {
    const yes = clientFor({ data: { id: "1" }, error: null });
    await expect(new SupabaseSavedWordStore(yes.client).has("u1", "a")).resolves.toBe(true);
    const no = clientFor({ data: null, error: null });
    await expect(new SupabaseSavedWordStore(no.client).has("u1", "a")).resolves.toBe(false);
  });

  it("DIC-AC-10: saves with an upsert and removes by user and word", async () => {
    const { client, b } = clientFor({ data: null, error: null });
    const store = new SupabaseSavedWordStore(client);
    await store.save("u1", sampleEntry());
    expect(b.upsert).toHaveBeenCalledWith({ user_id: "u1", word: "convenient", entry: sampleEntry() }, { onConflict: "user_id,word" });
    await store.remove("u1", "convenient");
    expect(b.delete).toHaveBeenCalled();
    expect(b.eq).toHaveBeenCalledWith("word", "convenient");
  });

  it("DIC-AC-10: database errors are infrastructure errors without the original message", async () => {
    const { client } = clientFor({ data: null, error: { message: "column secret missing" } });
    const store = new SupabaseSavedWordStore(client);
    for (const call of [store.list("u"), store.has("u", "a"), store.save("u", sampleEntry()), store.remove("u", "a")]) {
      await expect(call).rejects.toBeInstanceOf(InfrastructureError);
      await expect(call).rejects.not.toThrow(/secret/);
    }
  });
});
