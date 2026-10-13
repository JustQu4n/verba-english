import type { SupabaseClient } from "@supabase/supabase-js";

import { InfrastructureError } from "@/core/errors";

import type { CreditStore } from "../application/credit-store";

/** Reads `profiles.credits` (own row, by RLS) and spends through the `spend_credits` database function. */
export class SupabaseCreditStore implements CreditStore {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async balance(userId: string): Promise<number> {
    const { data, error } = await this.client
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .maybeSingle<{ credits: number }>();
    if (error) throw new InfrastructureError("Could not read credits", { cause: error });
    return data?.credits ?? 0;
  }

  async spend(amount: number): Promise<number | null> {
    const { data, error } = await this.client.rpc("spend_credits", { amount });
    if (error) throw new InfrastructureError("Could not spend credits", { cause: error });
    return typeof data === "number" ? data : null;
  }
}
