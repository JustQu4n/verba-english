import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/page-header";

import { AccountList } from "../users/account-list";

export const instant = false;

export default async function AdminLeaderboardPage({ params, searchParams }: PageProps<"/[locale]/admin/leaderboard">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Admin.leaderboard");
  const tCommon = await getTranslations("Dashboard");

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <AdminPageHeader title={t("title")} subtitle={t("subtitle")} />
      <Suspense fallback={<p className="text-muted-foreground">{tCommon("loading")}</p>}>
        <AccountList mode="leaderboard" searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
