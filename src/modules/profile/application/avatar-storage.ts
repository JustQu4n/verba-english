import type { AvatarType } from "../domain/avatar";

/** Where profile pictures are kept. */
export interface AvatarStorage {
  /** Stores a new picture for the user and returns the public https address it can be shown from. */
  upload(userId: string, image: { bytes: Uint8Array; type: AvatarType }): Promise<string>;
  /** Deletes a picture this storage made for the user. Anything else (a Google photo, another user's file) is left alone. */
  remove(userId: string, url: string): Promise<void>;
}
