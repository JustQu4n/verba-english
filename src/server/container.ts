import "server-only";
import { cache } from "react";

import { createClient } from "@/infrastructure/supabase/server";
import type { RoleReader } from "@/modules/admin/application/role-reader";
import type { UserDirectory } from "@/modules/admin/application/user-directory";
import { SupabaseUserDirectory } from "@/modules/admin/infrastructure/supabase-user-directory";
import { SupabaseRoleReader } from "@/modules/admin/infrastructure/supabase-role-reader";
import type { AuthService } from "@/modules/auth/application/auth-service";
import { SupabaseAuthService } from "@/modules/auth/infrastructure/supabase-auth-service";
import type { CreditStore } from "@/modules/credits/application/credit-store";
import { createAdminClient } from "@/infrastructure/supabase/admin";
import { SupabaseCreditStore } from "@/modules/credits/infrastructure/supabase-credit-store";
import type { LeaderboardSource } from "@/modules/leaderboard/application/leaderboard-source";
import { SupabaseLeaderboardSource } from "@/modules/leaderboard/infrastructure/supabase-leaderboard-source";
import type { PointsStore } from "@/modules/points/application/points-store";
import { SupabasePointsStore } from "@/modules/points/infrastructure/supabase-points-store";
import type { ProfileRepository } from "@/modules/profile/application/profile-repository";
import type { AvatarStorage } from "@/modules/profile/application/avatar-storage";
import { SupabaseAvatarStorage } from "@/modules/profile/infrastructure/supabase-avatar-storage";
import { SupabaseProfileRepository } from "@/modules/profile/infrastructure/supabase-profile-repository";
import type { GradeCache } from "@/modules/writing/application/grade-cache";
import type { PromptRepository } from "@/modules/writing/application/prompt-repository";
import type { AttemptStore } from "@/modules/writing/application/attempt-store";
import type { SentenceProgressStore } from "@/modules/writing/application/sentence-progress-store";
import type { SentenceGrader } from "@/modules/writing/application/sentence-grader";
import type { SentencePromptSource } from "@/modules/writing/application/sentence-prompt-source";
import type { AnswerSuggester } from "@/modules/writing/application/answer-suggester";
import type { ReferenceAnswerSource } from "@/modules/writing/application/reference-answer-source";
import { GeminiAnswerSuggester } from "@/modules/writing/infrastructure/gemini-answer-suggester";
import { SupabaseReferenceAnswerSource } from "@/modules/writing/infrastructure/supabase-reference-answer-source";
import { GeminiSentenceGrader } from "@/modules/writing/infrastructure/gemini-sentence-grader";
import { SupabaseAttemptStore } from "@/modules/writing/infrastructure/supabase-attempt-store";
import { SupabaseSentenceProgressStore } from "@/modules/writing/infrastructure/supabase-sentence-progress-store";
import { MemoryGradeCache } from "@/modules/writing/infrastructure/memory-grade-cache";
import { SupabasePromptRepository } from "@/modules/writing/infrastructure/supabase-prompt-repository";
import { SupabaseSentencePromptSource } from "@/modules/writing/infrastructure/supabase-sentence-prompt-source";

/** Cheapest stable Flash-Lite model; override with GEMINI_MODEL. */
const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";
/** Lowest thinking level this model accepts. Other models may need "low" (GEMINI_THINKING_LEVEL). */
const DEFAULT_THINKING_LEVEL = "minimal";

/** Presentation only sees the ports, not the concrete Supabase classes. */
export interface Container {
  auth: AuthService;
  profiles: ProfileRepository;
  /** Profile pictures (Supabase Storage). */
  avatars: AvatarStorage;
  roles: RoleReader;
  /** Accounts as admins see them: list, change role, credits and points (service role, admin use cases only). */
  users: UserDirectory;
  /** Admin-side prompt storage (drafts included). */
  prompts: PromptRepository;
  /** Learner-side source: published prompts only. */
  sentencePrompts: SentencePromptSource;
  credits: CreditStore;
  /** AI grader for sentence answers. */
  grader: SentenceGrader;
  /** Accepted answers per prompt, read only by trusted server code. */
  references: ReferenceAnswerSource;
  /** AI drafts of accepted answers for the admin form. */
  suggester: AnswerSuggester;
  gradeCache: GradeCache;
  /** Which sentences each learner completed. */
  sentenceProgress: SentenceProgressStore;
  points: PointsStore;
  /** Ranking of learners by points, read by trusted server code. */
  leaderboard: LeaderboardSource;
  /** Every graded attempt, written by trusted server code. */
  attempts: AttemptStore;
}

// Module level on purpose: the container is rebuilt per request, the cache must outlive it.
const gradeCache = new MemoryGradeCache();

/**
 * Composition root: the ONLY place that wires ports to concrete implementations.
 * Cached per request so a single Supabase client is shared.
 */
export const getContainer = cache(async (): Promise<Container> => {
  const supabase = await createClient();
  const gemini = {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    thinkingLevel: process.env.GEMINI_THINKING_LEVEL || DEFAULT_THINKING_LEVEL,
  };
  return {
    auth: new SupabaseAuthService(supabase),
    profiles: new SupabaseProfileRepository(supabase),
    avatars: new SupabaseAvatarStorage(supabase),
    roles: new SupabaseRoleReader(supabase),
    users: new SupabaseUserDirectory(createAdminClient),
    prompts: new SupabasePromptRepository(supabase),
    sentencePrompts: new SupabaseSentencePromptSource(supabase),
    credits: new SupabaseCreditStore(supabase),
    grader: new GeminiSentenceGrader(gemini),
    suggester: new GeminiAnswerSuggester(gemini),
    // Learners cannot read prompt_answers, so the answers are read with the service role by server code only.
    references: new SupabaseReferenceAnswerSource(createAdminClient),
    gradeCache,
    // Completions award points, so they are written by trusted server code with the service role, never by the user's session.
    sentenceProgress: new SupabaseSentenceProgressStore(supabase, createAdminClient),
    points: new SupabasePointsStore(supabase),
    leaderboard: new SupabaseLeaderboardSource(createAdminClient),
    attempts: new SupabaseAttemptStore(supabase, createAdminClient),
  };
});
