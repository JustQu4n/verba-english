import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { InfrastructureError } from "@/core/errors";

import { SupabasePointsStore } from "./supabase-points-store";

function build(result: { data: unknown; error: unknown }) {
  const eq = vi.fn(() => ({ maybeSingle: async () => result }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { store: new SupabasePointsStore({ from } as unknown as SupabaseClient), from, select, eq };
}

describe("SupabasePointsStore", () => {
  it("PTS-AC-05: reads points from the profile of the user", async () => {
    const { store, from, select, eq } = build({ data: { points: 120 }, error: null });
    await expect(store.total("u1")).resolves.toBe(120);
    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith("points");
    expect(eq).toHaveBeenCalledWith("id", "u1");
  });

  it("PTS-AC-05: no profile means no points", async () => {
    await expect(build({ data: null, error: null }).store.total("u1")).resolves.toBe(0);
  });

  it("PTS-AC-05: a database error is an infrastructure error without the original message", async () => {
    const promise = build({ data: null, error: { message: "column points missing" } }).store.total("u1");
    await expect(promise).rejects.toBeInstanceOf(InfrastructureError);
    await expect(promise).rejects.not.toThrow(/column/);
  });
});
