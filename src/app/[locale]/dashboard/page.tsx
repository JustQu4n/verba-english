import { getFormatter, getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { connection } from "next/server";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "@/i18n/navigation";
import { UnauthorizedError } from "@/core/errors";
import { getMyProfile } from "@/modules/profile/application/get-my-profile";
import { getContainer } from "@/server/container";

async function UserCard() {
  // Opt in to request-time rendering before anything reads the clock (next-intl does).
  await connection();
  const { auth, profiles } = await getContainer();
  const me = await getMyProfile({ auth, profiles }).catch((error) => {
    if (error instanceof UnauthorizedError) return null;
    throw error;
  });
  const [t, tCommon, format, locale] = await Promise.all([
    getTranslations("Dashboard"),
    getTranslations("Common"),
    getFormatter(),
    getLocale(),
  ]);
  if (!me) return redirect({ href: "/login", locale });

  return (
    <>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{me.user.email}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          {t("joined", {
            name: me.profile?.fullName ?? t("noName"),
            date: me.profile ? format.dateTime(me.profile.createdAt, { dateStyle: "medium" }) : "—",
          })}
        </p>
        <form action="/auth/signout" method="post">
          <Button variant="outline" type="submit">{tCommon("signOut")}</Button>
        </form>
      </CardContent>
    </>
  );
}

// The locale param is only known per request; these routes are prerendered for every
// locale by generateStaticParams, so allow this segment to block instead of streaming it.
export const instant = false;

export default async function DashboardPage({ params }: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Dashboard");
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <Suspense fallback={<CardContent>{t("loading")}</CardContent>}>
          <UserCard />
        </Suspense>
      </Card>
    </main>
  );
}
