import type { SupabaseClient } from "@supabase/supabase-js";

import { InfrastructureError, UnauthorizedError } from "@/core/errors";
import type { AuthService, OAuthProvider } from "@/modules/auth/application/auth-service";
import type { Credentials, SignUpInput } from "@/modules/auth/application/credentials";
import type { User } from "@/modules/auth/domain/user";

import { mapAuthError } from "./map-auth-error";

export class SupabaseAuthService implements AuthService {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async getCurrentUser(): Promise<User | null> {
    const { data } = await this.client.auth.getUser();
    return data.user ? { id: data.user.id, email: data.user.email ?? null } : null;
  }

  async signInWithPassword(credentials: Credentials): Promise<void> {
    const { error } = await this.client.auth.signInWithPassword(credentials);
    if (error) throw mapAuthError(error);
  }

  async signUpWithPassword({ fullName, email, password }: SignUpInput, redirectTo: string) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      // `full_name` is copied into profiles.full_name by the handle_new_user trigger.
      options: { emailRedirectTo: redirectTo, data: { full_name: fullName } },
    });
    if (error) throw mapAuthError(error);
    // With email confirmation on, Supabase answers an already registered email with a user that
    // has no identities instead of an error. Treat it like a new sign-up so emails are not leaked.
    const existingEmail = data.user?.identities?.length === 0;
    return { needsEmailConfirmation: existingEmail || !data.session };
  }

  async resendConfirmationEmail(email: string, redirectTo: string): Promise<void> {
    const { error } = await this.client.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw mapAuthError(error);
  }

  async getOAuthSignInUrl(provider: OAuthProvider, redirectTo: string): Promise<string> {
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider,
      // Let the server control the redirect (Server Action); don't let the SDK navigate the browser itself.
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data?.url) {
      throw new InfrastructureError("Could not start Google sign-in", { cause: error });
    }
    return data.url;
  }

  async exchangeCodeForSession(code: string): Promise<void> {
    const { error } = await this.client.auth.exchangeCodeForSession(code);
    if (error) throw new UnauthorizedError(error.message, { cause: error });
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }
}
