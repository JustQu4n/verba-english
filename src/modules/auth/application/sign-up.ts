import { parseOrThrow } from "@/core/validate";

import type { AuthService } from "./auth-service";
import { credentialsSchema } from "./credentials";

export async function signUp(
  auth: AuthService,
  input: unknown,
  redirectTo: string
): Promise<{ needsEmailConfirmation: boolean }> {
  return auth.signUpWithPassword(parseOrThrow(credentialsSchema, input), redirectTo);
}
