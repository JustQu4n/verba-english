"use server";

import { revalidatePath, updateTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { ForbiddenError, InfrastructureError, NotFoundError, UnauthorizedError, ValidationError } from "@/core/errors";
import { MAX_AVATAR_BYTES } from "@/modules/profile/domain/avatar";
import { removeMyAvatar, uploadMyAvatar } from "@/modules/profile/application/change-my-avatar";
import { updateMyName } from "@/modules/profile/application/update-my-profile";
import { LEADERBOARD_TAG } from "@/server/cached-sources";
import { getContainer } from "@/server/container";

export type ProfileActionResult =
  | { status: "ok"; avatarUrl?: string | null; fullName?: string | null }
  | { status: "error"; code: string };

/** The first validation message is a stable code the screen translates; anything unexpected becomes "unknown". */
function toErrorCode(error: unknown): string {
  if (error instanceof ValidationError) return error.message;
  if (error instanceof UnauthorizedError || error instanceof ForbiddenError) return "unauthorized";
  if (error instanceof InfrastructureError || error instanceof NotFoundError) {
    console.error(`Profile change failed: ${error.message}`);
    return "unavailable";
  }
  unstable_rethrow(error);
  console.error(error);
  return "unknown";
}

/** The name and picture show in the navbar of every page, so every cached page must be refreshed. */
const refreshEverywhere = () => {
  revalidatePath("/", "layout");
  // The name and picture also show on the leaderboard, which is cached for everyone.
  updateTag(LEADERBOARD_TAG);
};

export async function updateNameAction(fullName: string): Promise<ProfileActionResult> {
  try {
    const { auth, profiles } = await getContainer();
    const profile = await updateMyName({ auth, profiles }, { fullName });
    refreshEverywhere();
    return { status: "ok", fullName: profile.fullName };
  } catch (error) {
    return { status: "error", code: toErrorCode(error) };
  }
}

/** Receives the picture the browser already shrank. The size is checked before the bytes are read. */
export async function uploadAvatarAction(formData: FormData): Promise<ProfileActionResult> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { status: "error", code: "avatar_empty" };
  if (file.size > MAX_AVATAR_BYTES) return { status: "error", code: "avatar_too_large" };
  try {
    const { auth, profiles, avatars } = await getContainer();
    const profile = await uploadMyAvatar({ auth, profiles, avatars }, new Uint8Array(await file.arrayBuffer()));
    refreshEverywhere();
    return { status: "ok", avatarUrl: profile.avatarUrl };
  } catch (error) {
    return { status: "error", code: toErrorCode(error) };
  }
}

export async function removeAvatarAction(): Promise<ProfileActionResult> {
  try {
    const { auth, profiles, avatars } = await getContainer();
    const profile = await removeMyAvatar({ auth, profiles, avatars });
    refreshEverywhere();
    return { status: "ok", avatarUrl: profile.avatarUrl };
  } catch (error) {
    return { status: "error", code: toErrorCode(error) };
  }
}
