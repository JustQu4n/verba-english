import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { InfrastructureError } from "@/core/errors";

import { SupabaseSentencePromptSource } from "./supabase-sentence-prompt-source";

function sourceReturning(result: unknown) {
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
  return { source: new SupabaseSentencePromptSource({ from } as unknown as SupabaseClient), from, calls };
}

const selection = { level: "beginner", category: "food-drink" } as const;

describe("SupabaseSentencePromptSource", () => {
  it("APR-AC-12: returns only published sentence prompts of the chosen pair", async () => {
    const row = { id: "p1", difficulty: "beginner", category: "food-drink", prompt_text: "Tôi đói.", hint: "hungry" };
    const { source, from, calls } = sourceReturning({ data: [row], error: null });
    await expect(source.list(selection)).resolves.toEqual([
      { id: "p1", level: "beginner", category: "food-drink", vietnamese: "Tôi đói.", hint: "hungry" },
    ]);
    expect(from).toHaveBeenCalledWith("prompts");
    const eq = calls.filter(([n]) => n === "eq").map(([, a]) => a);
    expect(eq).toEqual(
      expect.arrayContaining([
        ["writing_type", "sentence"],
        ["is_published", true],
        ["difficulty", "beginner"],
        ["category", "food-drink"],
      ])
    );
  });

  it("APR-AC-12: a DB error is an InfrastructureError without the original message", async () => {
    const { source } = sourceReturning({ data: null, error: { message: "relation prompts does not exist" } });
    const promise = source.list(selection);
    await expect(promise).rejects.toBeInstanceOf(InfrastructureError);
    await expect(promise).rejects.not.toThrow(/relation/);
  });

  it("AIG-AC-04: get returns one published sentence prompt by id", async () => {
    const row = { id: "p1", difficulty: "beginner", category: "food-drink", prompt_text: "Tôi đói.", hint: "hungry" };
    const { source, calls } = sourceReturning({ data: row, error: null });
    await expect(source.get("p1")).resolves.toEqual({
      id: "p1",
      level: "beginner",
      category: "food-drink",
      vietnamese: "Tôi đói.",
      hint: "hungry",
    });
    const eq = calls.filter(([n]) => n === "eq").map(([, a]) => a);
    expect(eq).toEqual(
      expect.arrayContaining([
        ["id", "p1"],
        ["writing_type", "sentence"],
        ["is_published", true],
      ])
    );
  });

  it("AIG-AC-04: get returns null for a missing or invalid row", async () => {
    await expect(sourceReturning({ data: null, error: null }).source.get("p1")).resolves.toBeNull();
    const bad = { id: "p1", difficulty: "expert", category: "food-drink", prompt_text: "x", hint: "y" };
    await expect(sourceReturning({ data: bad, error: null }).source.get("p1")).resolves.toBeNull();
  });

  it("AIG-AC-04: get reports a DB error without its message", async () => {
    const { source } = sourceReturning({ data: null, error: { message: "relation prompts does not exist" } });
    const promise = source.get("p1");
    await expect(promise).rejects.toBeInstanceOf(InfrastructureError);
    await expect(promise).rejects.not.toThrow(/relation/);
  });
});
