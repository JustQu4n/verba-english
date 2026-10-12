import "server-only";
import { cache } from "react";

import { createClient } from "@/infrastructure/supabase/server";
import type { AuthService } from "@/modules/auth/application/auth-service";
import { SupabaseAuthService } from "@/modules/auth/infrastructure/supabase-auth-service";
import type { ProfileRepository } from "@/modules/profile/application/profile-repository";
import { SupabaseProfileRepository } from "@/modules/profile/infrastructure/supabase-profile-repository";

/** Presentation only sees the ports, not the concrete Supabase classes. */
export interface Container {
  auth: AuthService;
  profiles: ProfileRepository;
}

/**
 * Composition root: the ONLY place that wires ports to concrete implementations.
 * Cached per request so a single Supabase client is shared.
 */
export const getContainer = cache(async (): Promise<Container> => {
  const supabase = await createClient();
  return {
    auth: new SupabaseAuthService(supabase),
    profiles: new SupabaseProfileRepository(supabase),
  };
});
