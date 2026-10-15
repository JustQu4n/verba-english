import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Suspense, type ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";

import { AdminGate } from "./admin-gate";

// Same reason as the root layout: the locale param is only known per request.
export const instant = false;

export const metadata: Metadata = { robots: { index: false, follow: false } };

function GateFallback() {
  const t = useTranslations("Dashboard");
  return <p className="w-full px-5 py-12 text-muted-foreground sm:px-8">{t("loading")}</p>;
}

export default async function AdminLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <AdminShell>
      <Suspense fallback={<GateFallback />}>
        <AdminGate>{children as ReactNode}</AdminGate>
      </Suspense>
    </AdminShell>
  );
}
