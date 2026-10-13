import type { SupabaseClient } from "@supabase/supabase-js";

import type { RoleReader } from "@/modules/admin/application/role-reader";

/** Reads the role from the caller's own profile row (RLS lets users read only their own). */
export class SupabaseRoleReader implements RoleReader {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle<{ role: string | null }>();

    if (error) {
      // Fail closed: if we cannot tell, nobody gets admin rights.
      console.error(error);
      return false;
    }
    return data?.role === "admin";
  }
}
