import { ForbiddenError, UnauthorizedError } from "@/core/errors";
import type { AuthService } from "@/modules/auth/application/auth-service";
import type { User } from "@/modules/auth/domain/user";

import type { RoleReader } from "./role-reader";

interface Deps {
  auth: AuthService;
  roles: RoleReader;
}

/** Guard for every admin use case: must be signed in AND an admin, checked before any data is touched. */
export async function requireAdmin({ auth, roles }: Deps): Promise<User> {
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError("You are not signed in");
  if (!(await roles.isAdmin(user.id))) throw new ForbiddenError("Admin access required");
  return user;
}
