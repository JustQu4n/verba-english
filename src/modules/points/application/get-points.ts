import { UnauthorizedError } from "@/core/errors";
import type { AuthService } from "@/modules/auth/application/auth-service";

import type { PointsStore } from "./points-store";

/** The signed-in user's total points. */
export async function getPoints({ auth, points }: { auth: AuthService; points: PointsStore }): Promise<number> {
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError("You are not signed in");
  return points.total(user.id);
}
