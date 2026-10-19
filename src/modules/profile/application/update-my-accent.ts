import { z } from "zod";

import { UnauthorizedError } from "@/core/errors";
import { parseOrThrow } from "@/core/validate";
import type { AuthService } from "@/modules/auth/application/auth-service";

import { parseAccent } from "../domain/accent";
import type { Profile } from "../domain/profile";
import type { ProfileRepository } from "./profile-repository";

/** `null` means "back to the default black"; any other value must be one of the offered colours. The message is a code the screen translates. */
const schema = z.object({
  color: z.unknown().refine((value) => value === null || parseAccent(value) !== null, "invalid_color"),
});

/** Saves the signed-in user's accent colour, or clears it with null. */
export async function updateMyAccent(
  { auth, profiles }: { auth: AuthService; profiles: ProfileRepository },
  input: unknown
): Promise<Profile> {
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError("You are not signed in");
  const { color } = parseOrThrow(schema, input);
  return profiles.update(user.id, { accentColor: parseAccent(color) });
}
