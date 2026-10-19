import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { InfrastructureError, NotFoundError } from "@/core/errors";

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
        accent_color: "#0f1b3f",
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
      accentColor: "#0f1b3f",
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

  describe("update", () => {
    const row = { id: "u1", full_name: "New Name", avatar_url: "https://x.test/a.webp", created_at: "2026-01-01T00:00:00.000Z" };

    function updating(result: { data: unknown; error: unknown }) {
      const maybeSingle = async () => result;
      const select = vi.fn(() => ({ maybeSingle }));
      const eq = vi.fn(() => ({ select }));
      const update = vi.fn(() => ({ eq }));
      const from = vi.fn(() => ({ update }));
      return { repo: new SupabaseProfileRepository({ from } as unknown as SupabaseClient), update, eq };
    }

    it("PRP-AC-09: writes only the fields given, on the user's own row, and returns the mapped profile", async () => {
      const { repo, update, eq } = updating({ data: row, error: null });
      const profile = await repo.update("u1", { fullName: "New Name" });
      expect(update).toHaveBeenCalledWith({ full_name: "New Name" });
      expect(eq).toHaveBeenCalledWith("id", "u1");
      expect(profile).toEqual({ id: "u1", fullName: "New Name", avatarUrl: "https://x.test/a.webp", createdAt: new Date(row.created_at) });
    });

    it("PRP-AC-09: a null avatar clears it, and an unset field is left out", async () => {
      const { repo, update } = updating({ data: row, error: null });
      await repo.update("u1", { avatarUrl: null });
      expect(update).toHaveBeenCalledWith({ avatar_url: null });
    });

    it("PRP-AC-09: no row back is not found, a database error is an infrastructure error without its message", async () => {
      await expect(updating({ data: null, error: null }).repo.update("u1", { fullName: "A" })).rejects.toBeInstanceOf(NotFoundError);
      const failing = updating({ data: null, error: { message: "permission denied for table profiles" } }).repo.update("u1", { fullName: "A" });
      await expect(failing).rejects.toBeInstanceOf(InfrastructureError);
      await expect(failing).rejects.not.toThrow(/permission/);
    });
  });
});
