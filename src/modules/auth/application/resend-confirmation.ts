import { parseOrThrow } from "@/core/validate";

import type { AuthService } from "./auth-service";
import { emailOnlySchema } from "./credentials";

/** Sends the sign-up confirmation email again. */
export async function resendConfirmation(
  auth: AuthService,
  input: unknown,
  redirectTo: string
): Promise<void> {
  const { email } = parseOrThrow(emailOnlySchema, input);
  await auth.resendConfirmationEmail(email, redirectTo);
}
