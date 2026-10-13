import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { InfrastructureError } from "@/core/errors";

import type { NewAttempt } from "../domain/attempt";
import { SupabaseAttemptStore } from "./supabase-attempt-store";

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
  return { store: new SupabaseAttemptStore({ from } as unknown as SupabaseClient, () => ({}) as SupabaseClient), from, calls };
}

const attempt: NewAttempt = {
  userId: "u1",
  promptId: "p1",
  mode: "ai",
  correct: false,
  answer: "I go beach",
  answerKey: "i go beach",
  source: "ai",
  language: "vi",
  suggestion: "I go to the beach.",
  improvements: ["Thiếu to"],
  comment: "Gần đúng",
};

function writerStore(result: unknown) {
  const rpc = vi.fn().mockResolvedValue(result);
  return { store: new SupabaseAttemptStore({} as SupabaseClient, () => ({ rpc }) as unknown as SupabaseClient), rpc };
}

describe("SupabaseAttemptStore", () => {
  it("ATT-AC-01: saving goes through the server-only function with every field", async () => {
    const { store, rpc } = writerStore({ data: "id", error: null });
    await store.record(attempt);
    expect(rpc).toHaveBeenCalledWith("record_attempt", {
      p_user_id: "u1",
      p_prompt_id: "p1",
      p_mode: "ai",
      p_correct: false,
      p_answer: "I go beach",
      p_answer_key: "i go beach",
      p_source: "ai",
      p_language: "vi",
      p_suggestion: "I go to the beach.",
      p_improvements: ["Thiếu to"],
      p_comment: "Gần đúng",
    });
  });

  it("ATT-AC-02: write failures are infrastructure errors without the original message", async () => {
    const failing = writerStore({ data: null, error: { message: "violates check constraint" } }).store.record(attempt);
    await expect(failing).rejects.toBeInstanceOf(InfrastructureError);
    await expect(failing).rejects.not.toThrow(/constraint/);
    const noKey = new SupabaseAttemptStore({} as SupabaseClient, () => {
      throw new Error("missing key");
    });
    await expect(noKey.record(attempt)).rejects.toBeInstanceOf(InfrastructureError);
  });

  it("ATT-AC-04: lists the user's attempts newest first within the requested range", async () => {
    const { store, from, calls } = readStore({ data: [], error: null, count: 0 });
    await store.list("u1", { offset: 20, limit: 20 });
    expect(from).toHaveBeenCalledWith("practice_attempts");
    expect(calls).toEqual(
      expect.arrayContaining([
        ["eq", ["user_id", "u1"]],
        ["eq", ["correct", true]],
        ["order", ["created_at", { ascending: false }]],
        ["range", [20, 39]],
      ])
    );
  });

  it("ATT-AC-05: maps rows, accepts list or object embeds, and drops damaged notes", async () => {
    const row = {
      id: "a1",
      grading_mode: "reference",
      correct: true,
      tries: 3,
      created_at: "2026-10-13T10:00:00Z",
      prompts: { prompt_text: "Tôi đói." },
      submissions: [{ answer: "I am hungry." }],
      evaluations: { source: "reference", suggestion: "I am hungry.", improvements: ["S + be + adj", 3, null], comment: "" },
    };
    const orphan = { id: "a2", grading_mode: "ai", correct: false, tries: null, created_at: "2026-10-12T10:00:00Z", prompts: null, submissions: null, evaluations: { source: "ai", suggestion: "x", improvements: "broken", comment: "c" } };
    const { store } = readStore({ data: [row, orphan], error: null, count: 2 });
    const { items, total } = await store.list("u1", { offset: 0, limit: 20 });
    expect(total).toBe(2);
    expect(items[0]).toMatchObject({ id: "a1", vietnamese: "Tôi đói.", mode: "reference", correct: true, answer: "I am hungry.", source: "reference", tries: 3, improvements: ["S + be + adj"] });
    expect(items[0].createdAt).toEqual(new Date("2026-10-13T10:00:00Z"));
    expect(items[1]).toMatchObject({ tries: 1, vietnamese: null, answer: "", improvements: [], comment: "c" });
  });

  it("ATT-AC-04: a failing read is an infrastructure error", async () => {
    await expect(readStore({ data: null, error: { message: "boom" } }).store.list("u1", { offset: 0, limit: 20 })).rejects.toBeInstanceOf(InfrastructureError);
  });
});
