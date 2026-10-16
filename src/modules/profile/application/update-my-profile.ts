import { z } from "zod";

import { UnauthorizedError } from "@/core/errors";
import { parseOrThrow } from "@/core/validate";
import type { AuthService } from "@/modules/auth/application/auth-service";

import { MAX_NAME_LENGTH } from "../domain/avatar";
import type { Profile } from "../domain/profile";
import type { ProfileRepository } from "./profile-repository";

/** Messages are codes the form translates, never display text. */
const schema = z.object({
  fullName: z.string({ error: "name_required" }).trim().min(1, "name_required").max(MAX_NAME_LENGTH, "name_too_long"),
});

/** Changes the signed-in user's display name. */
export async function updateMyName(
  { auth, profiles }: { auth: AuthService; profiles: ProfileRepository },
  input: unknown
): Promise<Profile> {
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError("You are not signed in");
  const { fullName } = parseOrThrow(schema, input);
  return profiles.update(user.id, { fullName });
}
