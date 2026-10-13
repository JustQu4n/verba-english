import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { InfrastructureError } from "@/core/errors";

import { SupabaseCreditStore } from "./supabase-credit-store";

function balanceStore(result: { data: unknown; error: unknown }) {
  const eq = vi.fn(() => ({ maybeSingle: async () => result }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { store: new SupabaseCreditStore({ from } as unknown as SupabaseClient), from, select, eq };
}

function spendStore(result: { data: unknown; error: unknown }) {
  const rpc = vi.fn(async () => result);
  return { store: new SupabaseCreditStore({ rpc } as unknown as SupabaseClient), rpc };
}

describe("SupabaseCreditStore", () => {
  it("AIG-AC-14: reads credits from the profile of the user", async () => {
    const { store, from, select, eq } = balanceStore({ data: { credits: 57 }, error: null });
    await expect(store.balance("u1")).resolves.toBe(57);
    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith("credits");
    expect(eq).toHaveBeenCalledWith("id", "u1");
  });

  it("AIG-AC-14: no profile means no credits", async () => {
    const { store } = balanceStore({ data: null, error: null });
    await expect(store.balance("u1")).resolves.toBe(0);
  });

  it("AIG-AC-14: spends through the spend_credits function and returns the new balance", async () => {
    const { store, rpc } = spendStore({ data: 99, error: null });
    await expect(store.spend(1)).resolves.toBe(99);
    expect(rpc).toHaveBeenCalledWith("spend_credits", { amount: 1 });
  });

  it("AIG-AC-14: spending more than the balance gives null", async () => {
    const { store } = spendStore({ data: null, error: null });
    await expect(store.spend(1)).resolves.toBeNull();
  });

  it("AIG-AC-14: database errors are infrastructure errors without the original message", async () => {
    const read = balanceStore({ data: null, error: { message: "column credits does not exist" } });
    const readPromise = read.store.balance("u1");
    await expect(readPromise).rejects.toBeInstanceOf(InfrastructureError);
    await expect(readPromise).rejects.not.toThrow(/column/);

    const spend = spendStore({ data: null, error: { message: "function spend_credits missing" } });
    const spendPromise = spend.store.spend(1);
    await expect(spendPromise).rejects.toBeInstanceOf(InfrastructureError);
    await expect(spendPromise).rejects.not.toThrow(/function/);
  });
});
