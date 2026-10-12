import { unstable_rethrow } from "next/navigation";

import type { User } from "@/modules/auth/domain/user";
import type { Profile } from "@/modules/profile/domain/profile";

import { type DisplayProfile, toDisplayProfile } from "./profile-display";

export type AuthCta =
  | { readonly kind: "guest"; readonly href: "/login"; readonly label: "Sign in" }
  | {
      readonly kind: "member";
      readonly href: "/dashboard";
      readonly label: "Go to dashboard";
      readonly profile: DisplayProfile;
    };

const GUEST: AuthCta = { kind: "guest", href: "/login", label: "Sign in" };

/**
 * Account section at the top of the page: guest → Sign in button; signed in → display profile.
 * Session/profile read errors must not break the landing page.
 */
export async function resolveAuthCta(
  loadUser: () => Promise<User | null>,
  loadProfile: (userId: string) => Promise<Profile | null>,
  anonymousName?: string
): Promise<AuthCta> {
  let user: User | null;
  try {
    user = await loadUser();
  } catch (error) {
    unstable_rethrow(error); // redirects / dynamic data must propagate to Next
    console.error(error);
    return GUEST;
  }
  if (!user) return GUEST;

  let profile: Profile | null = null;
  try {
    profile = await loadProfile(user.id);
  } catch (error) {
    unstable_rethrow(error);
    console.error(error); // signed in but no profile: still show name/email from the account
  }

  return {
    kind: "member",
    href: "/dashboard",
    label: "Go to dashboard",
    profile: toDisplayProfile(user, profile, anonymousName),
  };
}
