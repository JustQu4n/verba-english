import { UnauthorizedError, ValidationError } from "@/core/errors";
import type { AuthService } from "@/modules/auth/application/auth-service";

import { defaultAvatarUrl, detectAvatarType, MAX_AVATAR_BYTES } from "../domain/avatar";
import type { Profile } from "../domain/profile";
import type { AvatarStorage } from "./avatar-storage";
import type { ProfileRepository } from "./profile-repository";

interface Deps {
  auth: AuthService;
  profiles: ProfileRepository;
  avatars: AvatarStorage;
}

const invalid = (code: string) => new ValidationError(code, [{ path: ["avatar"], message: code }]);

/** A failed cleanup must not undo a change that already worked; the old file is only orphaned. */
async function removeQuietly(avatars: AvatarStorage, userId: string, url: string | null | undefined) {
  if (!url) return;
  try {
    await avatars.remove(userId, url);
  } catch (error) {
    console.error("Could not delete the old avatar", error);
  }
}

/** Stores a new profile picture for the signed-in user, points the profile at it and deletes the previous one. */
export async function uploadMyAvatar({ auth, profiles, avatars }: Deps, bytes: Uint8Array): Promise<Profile> {
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError("You are not signed in");
  if (bytes.byteLength === 0) throw invalid("avatar_empty");
  if (bytes.byteLength > MAX_AVATAR_BYTES) throw invalid("avatar_too_large");
  const type = detectAvatarType(bytes);
  if (!type) throw invalid("avatar_type_invalid");

  const before = await profiles.findById(user.id);
  const url = await avatars.upload(user.id, { bytes, type });
  let profile: Profile;
  try {
    profile = await profiles.update(user.id, { avatarUrl: url });
  } catch (error) {
    // The file is not referenced by anything; do not leave it behind.
    await removeQuietly(avatars, user.id, url);
    throw error;
  }
  await removeQuietly(avatars, user.id, before?.avatarUrl);
  return profile;
}

/** Puts the default picture back for the signed-in user and deletes the picture they had uploaded. */
export async function removeMyAvatar({ auth, profiles, avatars }: Deps): Promise<Profile> {
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError("You are not signed in");
  const before = await profiles.findById(user.id);
  const profile = await profiles.update(user.id, { avatarUrl: defaultAvatarUrl(user.id) });
  await removeQuietly(avatars, user.id, before?.avatarUrl);
  return profile;
}
