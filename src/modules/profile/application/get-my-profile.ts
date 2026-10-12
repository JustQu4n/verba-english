import { UnauthorizedError } from "@/core/errors";
import type { AuthService } from "@/modules/auth/application/auth-service";
import type { User } from "@/modules/auth/domain/user";
import type { Profile } from "@/modules/profile/domain/profile";

import type { ProfileRepository } from "./profile-repository";

interface Deps {
  auth: AuthService;
  profiles: ProfileRepository;
}

export async function getMyProfile({
  auth,
  profiles,
}: Deps): Promise<{ user: User; profile: Profile | null }> {
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError("You are not signed in");
  return { user, profile: await profiles.findById(user.id) };
}
