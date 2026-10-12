import { getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { Link } from "@/i18n/navigation";
import { UserMenu } from "@/components/landing/user-menu";
import { Button } from "@/components/ui/button";
import { resolveAuthCta } from "@/lib/landing-cta";
import { getCurrentUser } from "@/modules/auth/application/get-current-user";
import { getContainer } from "@/server/container";

/** Account area at the top of the page: sign-in button or profile menu. Reads the session, so it must be wrapped in <Suspense>. */
export async function AuthButton() {
  // Opt in to request-time rendering before anything reads the clock (next-intl does),
  // otherwise Next rejects it as an unstable value while prerendering.
  await connection();
  const { auth, profiles } = await getContainer();
  const [t, tProfile] = await Promise.all([getTranslations("Common"), getTranslations("Profile")]);
  const cta = await resolveAuthCta(
    () => getCurrentUser(auth),
    (userId) => profiles.findById(userId),
    tProfile("anonymous")
  );

  if (cta.kind === "guest") {
    return (
      <Button asChild size="sm">
        <Link href={cta.href}>{t("signIn")}</Link>
      </Button>
    );
  }
  return <UserMenu profile={cta.profile} />;
}

export function AuthButtonFallback() {
  return <div aria-hidden className="h-8 w-24 animate-pulse rounded-full bg-muted" />;
}
