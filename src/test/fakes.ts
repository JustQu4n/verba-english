import { vi } from "vitest";

import type { AuthService } from "@/modules/auth/application/auth-service";

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
