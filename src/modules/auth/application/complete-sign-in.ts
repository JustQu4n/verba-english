import type { AuthService } from "./auth-service";

/** Completes sign-in after the user clicks the email confirmation link. */
export function completeSignIn(auth: AuthService, code: string): Promise<void> {
  return auth.exchangeCodeForSession(code);
}
