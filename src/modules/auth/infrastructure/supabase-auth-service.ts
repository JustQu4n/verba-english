import type { SupabaseClient } from "@supabase/supabase-js";

import { InfrastructureError, UnauthorizedError, ValidationError } from "@/core/errors";
import type { AuthService, OAuthProvider } from "@/modules/auth/application/auth-service";
import type { Credentials } from "@/modules/auth/application/credentials";
import type { User } from "@/modules/auth/domain/user";

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
    if (error) throw new UnauthorizedError(error.message, { cause: error });
  }

  async signUpWithPassword(credentials: Credentials, redirectTo: string) {
    const { data, error } = await this.client.auth.signUp({
      ...credentials,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw new ValidationError(error.message);
    return { needsEmailConfirmation: !data.session };
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
