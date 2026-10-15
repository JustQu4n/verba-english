import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/page-header";

import { AccountList } from "./account-list";

export const instant = false;

export default async function AdminUsersPage({ params, searchParams }: PageProps<"/[locale]/admin/users">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Admin.users");
  const tCommon = await getTranslations("Dashboard");

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <AdminPageHeader title={t("title")} subtitle={t("subtitle")} />
      <Suspense fallback={<p className="text-muted-foreground">{tCommon("loading")}</p>}>
        <AccountList mode="users" searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
