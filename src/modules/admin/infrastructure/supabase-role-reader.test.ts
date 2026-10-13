import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SupabaseRoleReader } from "./supabase-role-reader";

function readerReturning(result: { data: unknown; error: unknown }) {
  const eq = vi.fn(() => ({ maybeSingle: async () => result }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { reader: new SupabaseRoleReader({ from } as unknown as SupabaseClient), from, select, eq };
}

afterEach(() => vi.restoreAllMocks());

describe("SupabaseRoleReader", () => {
  it("APR-AC-03: confirms an admin profile", async () => {
    const { reader, from, select, eq } = readerReturning({ data: { role: "admin" }, error: null });
    await expect(reader.isAdmin("u1")).resolves.toBe(true);
    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith("role");
    expect(eq).toHaveBeenCalledWith("id", "u1");
  });

  it.each([{ role: "user" }, { role: "ADMIN" }, { role: null }, null])(
    "APR-AC-03: does not confirm %j",
    async (data) => {
      const { reader } = readerReturning({ data, error: null });
      await expect(reader.isAdmin("u1")).resolves.toBe(false);
    }
  );

  it("APR-AC-03: fails closed when the profile cannot be read", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { reader } = readerReturning({ data: { role: "admin" }, error: { message: "boom" } });
    await expect(reader.isAdmin("u1")).resolves.toBe(false);
  });
});
