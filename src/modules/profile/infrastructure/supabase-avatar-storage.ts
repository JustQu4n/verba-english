import type { SupabaseClient } from "@supabase/supabase-js";

import { InfrastructureError } from "@/core/errors";

import type { AvatarStorage } from "../application/avatar-storage";
import { AVATAR_EXTENSIONS, type AvatarType } from "../domain/avatar";

export const AVATAR_BUCKET = "avatars";
const PUBLIC_MARKER = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
const YEAR_IN_SECONDS = "31536000";

/**
 * Pictures live in the public Storage bucket `avatars`, one folder per user (`<user id>/<random>.<ext>`).
 * Every upload gets a new random name, so a changed picture is never served from a stale cache.
 * The bucket policies (migration 0015) only let a user write inside their own folder.
 */
export class SupabaseAvatarStorage implements AvatarStorage {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async upload(userId: string, { bytes, type }: { bytes: Uint8Array; type: AvatarType }): Promise<string> {
    const path = `${userId}/${crypto.randomUUID()}.${AVATAR_EXTENSIONS[type]}`;
    const bucket = this.client.storage.from(AVATAR_BUCKET);
    const { error } = await bucket.upload(path, bytes, { contentType: type, cacheControl: YEAR_IN_SECONDS, upsert: false });
    if (error) throw new InfrastructureError("Could not store the avatar", { cause: error });
    return bucket.getPublicUrl(path).data.publicUrl;
  }

  async remove(userId: string, url: string): Promise<void> {
    const path = this.ownPath(userId, url);
    if (!path) return;
    const { error } = await this.client.storage.from(AVATAR_BUCKET).remove([path]);
    if (error) throw new InfrastructureError("Could not delete the avatar", { cause: error });
  }

  /** The object path when `url` is a picture of this user in our bucket; null for any other address. */
  private ownPath(userId: string, url: string): string | null {
    const index = url.indexOf(PUBLIC_MARKER);
    if (index === -1) return null;
    let path: string;
    try {
      path = decodeURIComponent(url.slice(index + PUBLIC_MARKER.length).split(/[?#]/)[0]);
    } catch {
      return null;
    }
    const inOwnFolder = path.startsWith(`${userId}/`) && !path.includes("..") && path.split("/").length === 2;
    return inOwnFolder ? path : null;
  }
}
