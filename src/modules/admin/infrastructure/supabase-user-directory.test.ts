import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { InfrastructureError } from "@/core/errors";

import { SupabaseUserDirectory } from "./supabase-user-directory";

const row = {
  user_id: "u1", email: "a@b.c", full_name: " Alex ", avatar_url: "https://x.test/a.webp", role: "admin", points: 40, credits: 7,
  created_at: "2026-02-01T00:00:00.000Z", last_sign_in_at: "2026-03-01T00:00:00.000Z", rank: 2, total_count: "45",
};

function directory(options: { rpc?: { data: unknown; error: unknown }; update?: { data: unknown; error: unknown } } = {}) {
  const rpc = vi.fn().mockResolvedValue(options.rpc ?? { data: [row], error: null });
  const select = vi.fn().mockResolvedValue(options.update ?? { data: [{ id: "u1" }], error: null });
  const eq = vi.fn(() => ({ select }));
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ update }));
  const client = { rpc, from } as unknown as SupabaseClient;
  return { users: new SupabaseUserDirectory(() => client), rpc, from, update, eq };
}

const filter = { query: "lan", role: "admin", order: "points", offset: 20, limit: 20 } as const;

describe("SupabaseUserDirectory", () => {
  it("ADM-AC-09: lists through the database function with the filter and maps the rows", async () => {
    const { users, rpc } = directory();
    const result = await users.list(filter);
    expect(rpc).toHaveBeenCalledWith("admin_list_users", { p_query: "lan", p_role: "admin", p_order: "points", p_limit: 20, p_offset: 20 });
    expect(result.total).toBe(45);
    expect(result.items[0]).toEqual({
      id: "u1", email: "a@b.c", fullName: "Alex", avatarUrl: "https://x.test/a.webp", role: "admin", points: 40, credits: 7,
      createdAt: new Date("2026-02-01T00:00:00.000Z"), lastSignInAt: new Date("2026-03-01T00:00:00.000Z"), rank: 2,
    });
  });

  it("ADM-AC-09: an empty search is sent as null, an empty page has a total of 0, and an unsafe picture is dropped", async () => {
    const empty = directory({ rpc: { data: [], error: null } });
    await expect(empty.users.list({ ...filter, query: "" })).resolves.toEqual({ items: [], total: 0 });
    expect(empty.rpc).toHaveBeenCalledWith("admin_list_users", expect.objectContaining({ p_query: null }));
    const unsafe = directory({ rpc: { data: [{ ...row, avatar_url: "javascript:alert(1)", role: "weird", full_name: " ", last_sign_in_at: null, rank: null }], error: null } });
    const [account] = (await unsafe.users.list(filter)).items;
    expect(account).toMatchObject({ avatarUrl: null, role: "user", fullName: null, lastSignInAt: null, rank: null });
  });

  it("ADM-AC-10: finds one account, or null when there is none", async () => {
    const { users, rpc } = directory();
    await expect(users.find("u1")).resolves.toMatchObject({ id: "u1" });
    expect(rpc).toHaveBeenCalledWith("admin_get_user", { p_user_id: "u1" });
    await expect(directory({ rpc: { data: [], error: null } }).users.find("u1")).resolves.toBeNull();
  });

  it("ADM-AC-10: updates only the given columns on that account, then reads it back", async () => {
    const { users, from, update, eq, rpc } = directory();
    await expect(users.update("u1", { credits: 9, role: "user" })).resolves.toMatchObject({ id: "u1" });
    expect(from).toHaveBeenCalledWith("profiles");
    expect(update).toHaveBeenCalledWith({ credits: 9, role: "user" });
    expect(eq).toHaveBeenCalledWith("id", "u1");
    expect(rpc).toHaveBeenCalledWith("admin_get_user", { p_user_id: "u1" });
  });

  it("ADM-AC-10: an update that matches no account is null; an empty patch writes nothing", async () => {
    const none = directory({ update: { data: [], error: null } });
    await expect(none.users.update("u1", { points: 1 })).resolves.toBeNull();
    const noop = directory();
    await noop.users.update("u1", {});
    expect(noop.update).not.toHaveBeenCalled();
  });

  it("ADM-AC-10: reads the overview and turns the counts into numbers", async () => {
    const overview = {
      users: "5", admins: 1, new_users_7d: "2", ranked_learners: "3", points_total: "120", prompts_published: "4", prompts_draft: 1, attempts: "9", completions: "7",
    };
    const { users, rpc } = directory({ rpc: { data: [overview], error: null } });
    await expect(users.overview()).resolves.toEqual({
      users: 5, admins: 1, newUsers7d: 2, rankedLearners: 3, pointsTotal: 120, promptsPublished: 4, promptsDraft: 1, attempts: 9, completions: 7,
    });
    expect(rpc).toHaveBeenCalledWith("admin_overview");
    await expect(directory({ rpc: { data: [], error: null } }).users.overview()).rejects.toBeInstanceOf(InfrastructureError);
  });

  it("ADM-AC-10: database errors and a missing service key are infrastructure errors without the original message", async () => {
    const failing = { data: null, error: { message: "permission denied for table users" } };
    const d = directory({ rpc: failing, update: failing });
    for (const call of [() => d.users.list(filter), () => d.users.find("u1"), () => d.users.update("u1", { credits: 1 }), () => d.users.overview()]) {
      const promise = call();
      await expect(promise).rejects.toBeInstanceOf(InfrastructureError);
      await expect(promise).rejects.not.toThrow(/permission/);
    }
    const noKey = new SupabaseUserDirectory(() => {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    });
    await expect(noKey.list(filter)).rejects.toBeInstanceOf(InfrastructureError);
  });
});
