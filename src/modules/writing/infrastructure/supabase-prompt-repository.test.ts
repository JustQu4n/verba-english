import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { InfrastructureError } from "@/core/errors";

import { SupabasePromptRepository } from "./supabase-prompt-repository";

const ROW = {
  id: "11111111-1111-4111-8111-111111111111",
  difficulty: "intermediate",
  category: "work-business",
  prompt_text: "Tôi đi làm.",
  hint: "go to work",
  is_published: true,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};
const PROMPT = {
  id: ROW.id,
  level: "intermediate",
  category: "work-business",
  vietnamese: "Tôi đi làm.",
  hint: "go to work",
  published: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

/** A query builder whose every call returns itself and which resolves to `result` when awaited. */
function builder(result: unknown) {
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
  return { proxy, calls, called: (name: string) => calls.filter(([n]) => n === name).map(([, a]) => a) };
}

function repoWith(result: unknown) {
  const b = builder(result);
  const from = vi.fn(() => b.proxy);
  return { repo: new SupabasePromptRepository({ from } as unknown as SupabaseClient), from, b };
}

const filter = { status: "all", page: 1, pageSize: 20 } as const;

describe("SupabasePromptRepository", () => {
  it("APR-AC-11: maps rows to prompts with Date fields and returns the total", async () => {
    const { repo, from } = repoWith({ data: [ROW], count: 41, error: null });
    await expect(repo.list(filter)).resolves.toEqual({ items: [PROMPT], total: 41 });
    expect(from).toHaveBeenCalledWith("prompts");
  });

  it("APR-AC-11: builds the query from the filter (sentence rows, paging, newest first)", async () => {
    const { repo, b } = repoWith({ data: [], count: 0, error: null });
    await repo.list({ level: "advanced", category: "law-justice", status: "published", query: "100%_x", page: 3, pageSize: 20 });
    const eq = b.called("eq");
    expect(eq).toEqual(
      expect.arrayContaining([
        ["writing_type", "sentence"],
        ["difficulty", "advanced"],
        ["category", "law-justice"],
        ["is_published", true],
      ])
    );
    expect(b.called("ilike")).toEqual([["prompt_text", "%100\\%\\_x%"]]);
    expect(b.called("order")).toEqual([["created_at", { ascending: false }]]);
    expect(b.called("range")).toEqual([[40, 59]]);
  });

  it("APR-AC-11: filters drafts with is_published = false", async () => {
    const { repo, b } = repoWith({ data: [], count: 0, error: null });
    await repo.list({ ...filter, status: "draft" });
    expect(b.called("eq")).toContainEqual(["is_published", false]);
  });

  it("APR-AC-11: skips rows whose level or category is not in the catalog", async () => {
    const bad = { ...ROW, id: "x", category: null };
    const { repo } = repoWith({ data: [bad, ROW], count: 2, error: null });
    const { items } = await repo.list(filter);
    expect(items.map((p) => p.id)).toEqual([ROW.id]);
  });

  it("APR-AC-11: a page past the end is an empty page, not an error", async () => {
    const { repo } = repoWith({ data: null, count: null, error: { code: "PGRST103", message: "range" } });
    await expect(repo.list({ ...filter, page: 99 })).resolves.toEqual({ items: [], total: 0 });
  });

  it("APR-AC-11: findById returns the prompt or null", async () => {
    await expect(repoWith({ data: ROW, error: null }).repo.findById(ROW.id)).resolves.toEqual(PROMPT);
    await expect(repoWith({ data: null, error: null }).repo.findById(ROW.id)).resolves.toBeNull();
  });

  it("APR-AC-11: create stores a sentence row with a title taken from the sentence", async () => {
    const { repo, b } = repoWith({ data: ROW, error: null });
    const long = "a".repeat(120);
    await repo.create({ level: "beginner", category: "food-drink", vietnamese: long, hint: "h", published: false });
    expect(b.called("insert")[0][0]).toEqual({
      title: "a".repeat(80),
      writing_type: "sentence",
      prompt_text: long,
      hint: "h",
      difficulty: "beginner",
      category: "food-drink",
      is_published: false,
    });
  });

  it("APR-AC-11: update returns null when no row matched", async () => {
    const { repo, b } = repoWith({ data: null, error: null });
    await expect(
      repo.update(ROW.id, { level: "beginner", category: "food-drink", vietnamese: "Xin chào.", hint: "h", published: true })
    ).resolves.toBeNull();
    expect(b.called("update")[0][0]).toMatchObject({ prompt_text: "Xin chào.", title: "Xin chào.", is_published: true });
    expect(b.called("eq")).toEqual(expect.arrayContaining([["id", ROW.id], ["writing_type", "sentence"]]));
  });

  it("APR-AC-11: remove reports whether a row was deleted", async () => {
    await expect(repoWith({ data: [{ id: ROW.id }], error: null }).repo.remove(ROW.id)).resolves.toBe(true);
    await expect(repoWith({ data: [], error: null }).repo.remove(ROW.id)).resolves.toBe(false);
  });

  it("APR-AC-11: DB errors become InfrastructureError without leaking the original message", async () => {
    const error = { code: "42501", message: "permission denied for table prompts" };
    for (const run of [
      (r: SupabasePromptRepository) => r.list(filter),
      (r: SupabasePromptRepository) => r.findById(ROW.id),
      (r: SupabasePromptRepository) => r.create({ level: "beginner", category: "food-drink", vietnamese: "a", hint: "b", published: false }),
      (r: SupabasePromptRepository) => r.update(ROW.id, { level: "beginner", category: "food-drink", vietnamese: "a", hint: "b", published: false }),
      (r: SupabasePromptRepository) => r.remove(ROW.id),
    ]) {
      const promise = run(repoWith({ data: null, count: null, error }).repo);
      await expect(promise).rejects.toBeInstanceOf(InfrastructureError);
      await expect(promise).rejects.not.toThrow(/permission denied/);
    }
  });
});
