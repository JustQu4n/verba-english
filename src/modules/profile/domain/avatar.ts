/** The browser shrinks the picture before sending it, so a real avatar is far below this. */
export const MAX_AVATAR_BYTES = 512 * 1024;

export const AVATAR_EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
export type AvatarType = keyof typeof AVATAR_EXTENSIONS;

const startsWith = (bytes: Uint8Array, signature: readonly number[], offset = 0) =>
  signature.every((byte, index) => bytes[offset + index] === byte);

/**
 * What the bytes really are, from their first bytes. The type the browser claims is never trusted:
 * a file can be named photo.png and still be anything.
 */
export function detectAvatarType(bytes: Uint8Array): AvatarType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // "RIFF" <size> "WEBP"
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}

export const MAX_NAME_LENGTH = 80;

const DEFAULT_AVATAR_BASE = "https://api.dicebear.com/9.x/identicon/svg";

/**
 * The picture every account starts with: a black and white identicon made from the user id alone (no name or email
 * leaves the app). Must match public.default_avatar_url in migration 0016.
 */
export function defaultAvatarUrl(userId: string): string {
  return `${DEFAULT_AVATAR_BASE}?seed=${encodeURIComponent(userId)}&backgroundColor=000000&rowColor=ffffff`;
}

/** True for the generated starting picture, as opposed to one the user chose (or their Google photo). */
export function isDefaultAvatar(url: string | null | undefined): boolean {
  return typeof url === "string" && url.startsWith(`${DEFAULT_AVATAR_BASE}?`);
}
