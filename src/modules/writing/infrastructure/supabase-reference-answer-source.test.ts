import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { InfrastructureError } from "@/core/errors";

import { SupabaseReferenceAnswerSource } from "./supabase-reference-answer-source";

function sourceWith(result: { data: unknown; error: unknown }) {
  const eq = vi.fn(() => ({ maybeSingle: async () => result }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { source: new SupabaseReferenceAnswerSource(() => ({ from }) as unknown as SupabaseClient), from, select, eq };
}

describe("SupabaseReferenceAnswerSource", () => {
  it("ANS-AC-08: reads only the answers of the prompt", async () => {
    const answers = [{ text: "I go to work.", structureVi: "a", structureEn: "b" }];
    const { source, from, select, eq } = sourceWith({ data: { answers }, error: null });
    await expect(source.find("p1")).resolves.toEqual(answers);
    expect(from).toHaveBeenCalledWith("prompt_answers");
    expect(select).toHaveBeenCalledWith("answers");
    expect(eq).toHaveBeenCalledWith("prompt_id", "p1");
  });

  it("ANS-AC-08: a prompt without a row has no answers", async () => {
    await expect(sourceWith({ data: null, error: null }).source.find("p1")).resolves.toEqual([]);
  });

  it("ANS-AC-08: errors, and a missing service key, are infrastructure errors without the original message", async () => {
    const promise = sourceWith({ data: null, error: { message: "relation prompt_answers missing" } }).source.find("p1");
    await expect(promise).rejects.toBeInstanceOf(InfrastructureError);
    await expect(promise).rejects.not.toThrow(/relation/);
    const noKey = new SupabaseReferenceAnswerSource(() => {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    });
    await expect(noKey.find("p1")).rejects.toBeInstanceOf(InfrastructureError);
  });
});
