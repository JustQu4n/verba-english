import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { InfrastructureError } from "@/core/errors";

import { SupabaseProfileRepository } from "./supabase-profile-repository";

function repoReturning(result: { data: unknown; error: unknown }) {
  const eq = vi.fn(() => ({ maybeSingle: async () => result }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { repo: new SupabaseProfileRepository({ from } as unknown as SupabaseClient), from, eq };
}

describe("SupabaseProfileRepository", () => {
  it("PRF-AC-04: maps a DB row to the domain entity", async () => {
    const { repo, from, eq } = repoReturning({
      data: {
        id: "u1",
        full_name: "Alex Lee",
        avatar_url: null,
        created_at: "2026-01-01T00:00:00.000Z",
      },
      error: null,
    });

    const profile = await repo.findById("u1");

    expect(from).toHaveBeenCalledWith("profiles");
    expect(eq).toHaveBeenCalledWith("id", "u1");
    expect(profile).toEqual({
      id: "u1",
      fullName: "Alex Lee",
      avatarUrl: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    expect(profile?.createdAt).toBeInstanceOf(Date);
  });

  it("PRF-AC-05: no row → null", async () => {
    const { repo } = repoReturning({ data: null, error: null });
    await expect(repo.findById("nope")).resolves.toBeNull();
  });

  it("PRF-AC-06: DB error → InfrastructureError, original message not leaked", async () => {
    const { repo } = repoReturning({ data: null, error: { message: "relation profiles does not exist" } });
    const promise = repo.findById("u1");
    await expect(promise).rejects.toBeInstanceOf(InfrastructureError);
    await expect(promise).rejects.not.toThrow(/relation/);
  });
});
