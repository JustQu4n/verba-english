import { parseOrThrow } from "@/core/validate";

import type { AuthService } from "./auth-service";
import { signInSchema } from "./credentials";

export async function signIn(auth: AuthService, input: unknown): Promise<void> {
  await auth.signInWithPassword(parseOrThrow(signInSchema, input));
}
