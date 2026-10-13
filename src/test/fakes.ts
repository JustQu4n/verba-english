import { vi } from "vitest";

import type { RoleReader } from "@/modules/admin/application/role-reader";
import type { AuthService } from "@/modules/auth/application/auth-service";
import type { PromptRepository } from "@/modules/writing/application/prompt-repository";
import type { Prompt } from "@/modules/writing/domain/prompt";

/** Fake AuthService: every method is vi.fn(), overridden per test. */
export function fakeAuth(overrides: Partial<AuthService> = {}): AuthService {
  return {
    getCurrentUser: vi.fn().mockResolvedValue(null),
    signInWithPassword: vi.fn().mockResolvedValue(undefined),
    signUpWithPassword: vi.fn().mockResolvedValue({ needsEmailConfirmation: false }),
    resendConfirmationEmail: vi.fn().mockResolvedValue(undefined),
    getOAuthSignInUrl: vi.fn().mockResolvedValue("https://accounts.google.com/o/oauth2/v2/auth?x=1"),
    exchangeCodeForSession: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

export const ADMIN_USER = { id: "admin-1", email: "admin@verba.test" };

/** Fake RoleReader: everyone is an admin unless told otherwise. */
export function fakeRoles(isAdmin = true): RoleReader {
  return { isAdmin: vi.fn().mockResolvedValue(isAdmin) };
}

export function samplePrompt(overrides: Partial<Prompt> = {}): Prompt {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    level: "beginner",
    category: "food-drink",
    vietnamese: "Tôi thích ăn phở.",
    hint: "like, pho",
    published: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    ...overrides,
  };
}

/** Fake PromptRepository: every method is vi.fn(), overridden per test. */
export function fakePromptRepo(overrides: Partial<PromptRepository> = {}): PromptRepository {
  return {
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    findById: vi.fn().mockResolvedValue(samplePrompt()),
    create: vi.fn().mockImplementation(async (draft) => samplePrompt({ ...draft })),
    update: vi.fn().mockImplementation(async (_id, draft) => samplePrompt({ ...draft })),
    remove: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}
