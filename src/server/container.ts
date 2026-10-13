import "server-only";
import { cache } from "react";

import { createClient } from "@/infrastructure/supabase/server";
import type { RoleReader } from "@/modules/admin/application/role-reader";
import { SupabaseRoleReader } from "@/modules/admin/infrastructure/supabase-role-reader";
import type { AuthService } from "@/modules/auth/application/auth-service";
import { SupabaseAuthService } from "@/modules/auth/infrastructure/supabase-auth-service";
import type { ProfileRepository } from "@/modules/profile/application/profile-repository";
import { SupabaseProfileRepository } from "@/modules/profile/infrastructure/supabase-profile-repository";
import type { PromptRepository } from "@/modules/writing/application/prompt-repository";
import type { SentencePromptSource } from "@/modules/writing/application/sentence-prompt-source";
import { SupabasePromptRepository } from "@/modules/writing/infrastructure/supabase-prompt-repository";
import { SupabaseSentencePromptSource } from "@/modules/writing/infrastructure/supabase-sentence-prompt-source";

/** Presentation only sees the ports, not the concrete Supabase classes. */
export interface Container {
  auth: AuthService;
  profiles: ProfileRepository;
  roles: RoleReader;
  /** Admin-side prompt storage (drafts included). */
  prompts: PromptRepository;
  /** Learner-side source: published prompts only. */
  sentencePrompts: SentencePromptSource;
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
    roles: new SupabaseRoleReader(supabase),
    prompts: new SupabasePromptRepository(supabase),
    sentencePrompts: new SupabaseSentencePromptSource(supabase),
  };
});
