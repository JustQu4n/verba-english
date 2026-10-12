import type { User } from "@/modules/auth/domain/user";
import type { Profile } from "@/modules/profile/domain/profile";

export interface DisplayProfile {
  readonly name: string;
  readonly email: string;
  readonly initials: string;
  readonly avatarUrl: string | null;
}

const DEFAULT_ANONYMOUS_NAME = "User";

function pickName(user: User, profile: Profile | null, anonymousName: string): string {
  const fullName = profile?.fullName?.trim();
  if (fullName) return fullName;
  const localPart = user.email?.split("@")[0]?.trim();
  return localPart || anonymousName;
}

/** First letters of the first and last words, keeping Vietnamese diacritics (NFC-normalized so marks are not split). */
function pickInitials(name: string): string {
  const words = name.normalize("NFC").split(/\s+/).filter(Boolean);
  const first = words[0];
  const last = words.length > 1 ? words[words.length - 1] : undefined;
  const letters = [first, last].filter((w): w is string => Boolean(w)).map((w) => Array.from(w)[0]);
  return letters.join("").toLocaleUpperCase("vi") || "?";
}

/** Only accepts https images: blocks `javascript:`, `data:`, `http:` and malformed URLs. */
function safeAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** `anonymousName` is the translated generic name, used when there is neither a name nor an email. */
export function toDisplayProfile(
  user: User,
  profile: Profile | null,
  anonymousName: string = DEFAULT_ANONYMOUS_NAME
): DisplayProfile {
  const name = pickName(user, profile, anonymousName);
  return {
    name,
    email: user.email ?? "",
    initials: pickInitials(name),
    avatarUrl: safeAvatarUrl(profile?.avatarUrl),
  };
}
