import type { User } from "@/modules/auth/domain/user";

import type { AuthService } from "./auth-service";

export function getCurrentUser(auth: AuthService): Promise<User | null> {
  return auth.getCurrentUser();
}
