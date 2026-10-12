import type { SupabaseClient } from "@supabase/supabase-js";

import { InfrastructureError } from "@/core/errors";
import type { ProfileRepository } from "@/modules/profile/application/profile-repository";
import type { Profile } from "@/modules/profile/domain/profile";

interface ProfileRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export class SupabaseProfileRepository implements ProfileRepository {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select("id, full_name, avatar_url, created_at")
      .eq("id", id)
      .maybeSingle<ProfileRow>();

    if (error) throw new InfrastructureError("Could not read profile", { cause: error });
    if (!data) return null;

    return {
      id: data.id,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      createdAt: new Date(data.created_at),
    };
  }
}
