import { UnauthorizedError } from "@/core/errors";
import type { AuthService } from "@/modules/auth/application/auth-service";

import type { CreditStore } from "./credit-store";

/** The signed-in user's credit balance. */
export async function getCredits({ auth, credits }: { auth: AuthService; credits: CreditStore }): Promise<number> {
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError("You are not signed in");
  return credits.balance(user.id);
}
