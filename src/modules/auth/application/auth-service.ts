import type { User } from "@/modules/auth/domain/user";

import type { Credentials, SignUpInput } from "./credentials";

export type OAuthProvider = "google";

/** Port: the use cases only know this interface, not Supabase. */
export interface AuthService {
  getCurrentUser(): Promise<User | null>;
  signInWithPassword(credentials: Credentials): Promise<void>;
  signUpWithPassword(
    input: SignUpInput,
    redirectTo: string
  ): Promise<{ needsEmailConfirmation: boolean }>;
  /** Sends the sign-up confirmation email again. */
  resendConfirmationEmail(email: string, redirectTo: string): Promise<void>;
  /** OAuth provider URL to redirect the user to (PKCE flow). */
  getOAuthSignInUrl(provider: OAuthProvider, redirectTo: string): Promise<string>;
  exchangeCodeForSession(code: string): Promise<void>;
  signOut(): Promise<void>;
}
