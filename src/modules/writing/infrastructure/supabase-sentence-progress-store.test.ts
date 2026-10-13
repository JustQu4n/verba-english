import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { InfrastructureError } from "@/core/errors";

import { SupabaseSentenceProgressStore } from "./supabase-sentence-progress-store";

function readStore(result: unknown) {
  const calls: [string, unknown[]][] = [];
  const proxy: unknown = new Proxy(
    {},
    {
      get(_t, name: string) {
        if (name === "then") return (resolve: (v: unknown) => void) => resolve(result);
        return (...args: unknown[]) => {
          calls.push([name, args]);
          return proxy;
        };
      },
    }
  );
  const from = vi.fn(() => proxy);
  return { store: new SupabaseSentenceProgressStore({ from } as unknown as SupabaseClient, () => ({}) as SupabaseClient), from, calls };
}

const selection = { level: "beginner", category: "food-drink" } as const;

describe("SupabaseSentenceProgressStore", () => {
  it("SPG-AC-08: reads the user's completions of published sentences of the pair", async () => {
    const { store, from, calls } = readStore({ data: [{ prompt_id: "p1" }, { prompt_id: "p2" }], error: null });
    await expect(store.completedIds("u1", selection)).resolves.toEqual(new Set(["p1", "p2"]));
    expect(from).toHaveBeenCalledWith("sentence_completions");
    const eq = calls.filter(([n]) => n === "eq").map(([, a]) => a);
    expect(eq).toEqual(
      expect.arrayContaining([
        ["user_id", "u1"],
        ["prompts.writing_type", "sentence"],
        ["prompts.is_published", true],
        ["prompts.difficulty", "beginner"],
        ["prompts.category", "food-drink"],
      ])
    );
  });

  it("SPG-AC-08: no rows means an empty set", async () => {
    await expect(readStore({ data: null, error: null }).store.completedIds("u1", selection)).resolves.toEqual(new Set());
  });

  it("SPG-AC-14: reads the stored counters of the level, keeping only known categories", async () => {
    const { store, from, calls } = readStore({
      data: [{ category: "food-drink", completed: 2 }, { category: "unknown", completed: 9 }],
      error: null,
    });
    await expect(store.completedByCategory("u1", "beginner")).resolves.toEqual({ "food-drink": 2 });
    expect(from).toHaveBeenCalledWith("sentence_progress");
    expect(calls.filter(([n]) => n === "eq").map(([, a]) => a)).toEqual([["user_id", "u1"], ["difficulty", "beginner"]]);
  });

  it("SPG-AC-14: a failing counter read is an infrastructure error", async () => {
    await expect(readStore({ data: null, error: { message: "boom" } }).store.completedByCategory("u1", "beginner")).rejects.toBeInstanceOf(InfrastructureError);
  });

  function writerStore(result: unknown) {
    const rpc = vi.fn().mockResolvedValue(result);
    const store = new SupabaseSentenceProgressStore({} as SupabaseClient, () => ({ rpc }) as unknown as SupabaseClient);
    return { store, rpc };
  }

  it("PTS-AC-01: recording goes through the server-only function and returns the awarded points", async () => {
    const { store, rpc } = writerStore({ data: [{ awarded: 10, total_points: 30 }], error: null });
    await expect(store.markCompleted("u1", "p1")).resolves.toEqual({ awarded: 10, totalPoints: 30 });
    expect(rpc).toHaveBeenCalledWith("complete_sentence", { p_user_id: "u1", p_prompt_id: "p1" });
  });

  it("PTS-AC-02: a repeat completion awards nothing", async () => {
    const { store } = writerStore({ data: [{ awarded: 0, total_points: 30 }], error: null });
    await expect(store.markCompleted("u1", "p1")).resolves.toEqual({ awarded: 0, totalPoints: 30 });
  });

  it("SPG-AC-08: database errors are infrastructure errors without the original message", async () => {
    const read = readStore({ data: null, error: { message: "relation sentence_completions missing" } });
    const readPromise = read.store.completedIds("u1", selection);
    await expect(readPromise).rejects.toBeInstanceOf(InfrastructureError);
    await expect(readPromise).rejects.not.toThrow(/relation/);

    const failing = writerStore({ data: null, error: { message: "violates foreign key" } });
    const writePromise = failing.store.markCompleted("u1", "p1");
    await expect(writePromise).rejects.toBeInstanceOf(InfrastructureError);
    await expect(writePromise).rejects.not.toThrow(/foreign/);
    await expect(writerStore({ data: [], error: null }).store.markCompleted("u1", "p1")).rejects.toBeInstanceOf(
      InfrastructureError
    );
    const noKey = new SupabaseSentenceProgressStore({} as SupabaseClient, () => {
      throw new Error("missing key");
    });
    await expect(noKey.markCompleted("u1", "p1")).rejects.toBeInstanceOf(InfrastructureError);
  });
});
