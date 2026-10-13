import type { SupabaseClient } from "@supabase/supabase-js";

import { InfrastructureError } from "@/core/errors";

import type { PointsStore } from "../application/points-store";

/** Reads `profiles.points` (own row, by RLS). Points are only ever written by the database function complete_sentence. */
export class SupabasePointsStore implements PointsStore {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async total(userId: string): Promise<number> {
    const { data, error } = await this.client
      .from("profiles")
      .select("points")
      .eq("id", userId)
      .maybeSingle<{ points: number }>();
    if (error) throw new InfrastructureError("Could not read points", { cause: error });
    return data?.points ?? 0;
  }
}
