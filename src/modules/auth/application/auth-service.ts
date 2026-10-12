import type { User } from "@/modules/auth/domain/user";

import type { Credentials } from "./credentials";

export type OAuthProvider = "google";

/** Port: the use cases only know this interface, not Supabase. */
export interface AuthService {
  getCurrentUser(): Promise<User | null>;
  signInWithPassword(credentials: Credentials): Promise<void>;
  signUpWithPassword(
    credentials: Credentials,
    redirectTo: string
  ): Promise<{ needsEmailConfirmation: boolean }>;
  /** OAuth provider URL to redirect the user to (PKCE flow). */
  getOAuthSignInUrl(provider: OAuthProvider, redirectTo: string): Promise<string>;
  exchangeCodeForSession(code: string): Promise<void>;
  signOut(): Promise<void>;
}
