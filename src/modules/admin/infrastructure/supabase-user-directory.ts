import type { SupabaseClient } from "@supabase/supabase-js";

import { InfrastructureError } from "@/core/errors";
import { safeAvatarUrl } from "@/lib/profile-display";

import type { UserDirectory, UserFilter, UserPatch } from "../application/user-directory";
import type { AccountRole, AdminOverview, UserAccount } from "../domain/user-account";

interface UserRow {
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  points: number;
  credits: number;
  created_at: string;
  last_sign_in_at: string | null;
  rank: number | null;
  total_count: number | string;
}

interface OverviewRow {
  users: number | string;
  admins: number | string;
  new_users_7d: number | string;
  ranked_learners: number | string;
  points_total: number | string;
  prompts_published: number | string;
  prompts_draft: number | string;
  attempts: number | string;
  completions: number | string;
}

/** Postgres returns bigint counts as strings. */
const num = (value: number | string) => Number(value);

const toAccount = (row: UserRow): UserAccount => ({
  id: row.user_id,
  email: row.email,
  fullName: row.full_name?.trim() || null,
  avatarUrl: safeAvatarUrl(row.avatar_url),
  role: row.role === "admin" ? "admin" : ("user" satisfies AccountRole),
  points: row.points,
  credits: row.credits,
  createdAt: new Date(row.created_at),
  lastSignInAt: row.last_sign_in_at ? new Date(row.last_sign_in_at) : null,
  rank: row.rank,
});

/**
 * Reads accounts through the admin_* database functions and changes them with the service role: the email and last
 * sign-in live in auth.users, and role, credits and points are columns no user session may write. The client is
 * created per call so a missing key fails here, with an infrastructure error.
 */
export class SupabaseUserDirectory implements UserDirectory {
  private readonly createClient: () => SupabaseClient;

  constructor(createClient: () => SupabaseClient) {
    this.createClient = createClient;
  }

  private client(): SupabaseClient {
    try {
      return this.createClient();
    } catch (error) {
      throw new InfrastructureError("Could not reach the account store", { cause: error });
    }
  }

  async list(filter: UserFilter): Promise<{ items: UserAccount[]; total: number }> {
    const { data, error } = await this.client().rpc("admin_list_users", {
      p_query: filter.query === "" ? null : filter.query,
      p_role: filter.role,
      p_order: filter.order,
      p_limit: filter.limit,
      p_offset: filter.offset,
    });
    if (error) throw new InfrastructureError("Could not read the accounts", { cause: error });
    const rows = (data as UserRow[] | null) ?? [];
    return { items: rows.map(toAccount), total: rows.length > 0 ? num(rows[0].total_count) : 0 };
  }

  async find(id: string): Promise<UserAccount | null> {
    const { data, error } = await this.client().rpc("admin_get_user", { p_user_id: id });
    if (error) throw new InfrastructureError("Could not read the account", { cause: error });
    const row = (data as UserRow[] | null)?.[0];
    return row ? toAccount(row) : null;
  }

  async update(id: string, patch: UserPatch): Promise<UserAccount | null> {
    const changes: Record<string, string | number> = {};
    if (patch.role !== undefined) changes.role = patch.role;
    if (patch.credits !== undefined) changes.credits = patch.credits;
    if (patch.points !== undefined) changes.points = patch.points;

    if (Object.keys(changes).length > 0) {
      const { data, error } = await this.client().from("profiles").update(changes).eq("id", id).select("id");
      if (error) throw new InfrastructureError("Could not update the account", { cause: error });
      if (!data || data.length === 0) return null;
    }
    return this.find(id);
  }

  async overview(): Promise<AdminOverview> {
    const { data, error } = await this.client().rpc("admin_overview");
    if (error) throw new InfrastructureError("Could not read the overview", { cause: error });
    const row = (data as OverviewRow[] | null)?.[0];
    if (!row) throw new InfrastructureError("The overview came back empty");
    return {
      users: num(row.users),
      admins: num(row.admins),
      newUsers7d: num(row.new_users_7d),
      rankedLearners: num(row.ranked_learners),
      pointsTotal: num(row.points_total),
      promptsPublished: num(row.prompts_published),
      promptsDraft: num(row.prompts_draft),
      attempts: num(row.attempts),
      completions: num(row.completions),
    };
  }
}
