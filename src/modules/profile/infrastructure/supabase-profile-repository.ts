import type { SupabaseClient } from "@supabase/supabase-js";

import { InfrastructureError, NotFoundError } from "@/core/errors";
import type { ProfilePatch, ProfileRepository } from "@/modules/profile/application/profile-repository";
import type { Profile } from "@/modules/profile/domain/profile";

interface ProfileRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

const COLUMNS = "id, full_name, avatar_url, created_at";

const toProfile = (row: ProfileRow): Profile => ({
  id: row.id,
  fullName: row.full_name,
  avatarUrl: row.avatar_url,
  createdAt: new Date(row.created_at),
});

export class SupabaseProfileRepository implements ProfileRepository {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select(COLUMNS)
      .eq("id", id)
      .maybeSingle<ProfileRow>();

    if (error) throw new InfrastructureError("Could not read profile", { cause: error });
    return data ? toProfile(data) : null;
  }

  async update(id: string, patch: ProfilePatch): Promise<Profile> {
    const changes: Record<string, string | null> = {};
    if (patch.fullName !== undefined) changes.full_name = patch.fullName;
    if (patch.avatarUrl !== undefined) changes.avatar_url = patch.avatarUrl;

    // Row level security lets a session change its own row only; no row back means it is not there.
    const { data, error } = await this.client.from("profiles").update(changes).eq("id", id).select(COLUMNS).maybeSingle<ProfileRow>();

    if (error) throw new InfrastructureError("Could not update profile", { cause: error });
    if (!data) throw new NotFoundError("Profile not found");
    return toProfile(data);
  }
}
