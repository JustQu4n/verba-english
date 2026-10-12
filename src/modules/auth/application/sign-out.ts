import type { AuthService } from "./auth-service";

export function signOut(auth: AuthService): Promise<void> {
  return auth.signOut();
}
