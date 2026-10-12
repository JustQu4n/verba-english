import { parseOrThrow } from "@/core/validate";

import type { AuthService } from "./auth-service";
import { credentialsSchema } from "./credentials";

export async function signIn(auth: AuthService, input: unknown): Promise<void> {
  await auth.signInWithPassword(parseOrThrow(credentialsSchema, input));
}
