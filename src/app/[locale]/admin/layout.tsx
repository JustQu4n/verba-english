import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Suspense, type ReactNode } from "react";

import { AdminHeader } from "@/components/admin/admin-header";

import { AdminGate } from "./admin-gate";

// Same reason as the root layout: the locale param is only known per request.
export const instant = false;

export const metadata: Metadata = { robots: { index: false, follow: false } };

function GateFallback() {
  const t = useTranslations("Dashboard");
  return <p className="mx-auto w-full max-w-6xl px-5 py-12 text-muted-foreground sm:px-8">{t("loading")}</p>;
}

export default async function AdminLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="theme-mono flex min-h-screen flex-col bg-background text-foreground">
      <AdminHeader />
      <main id="main" className="flex-1">
        <Suspense fallback={<GateFallback />}>
          <AdminGate>{children as ReactNode}</AdminGate>
        </Suspense>
      </main>
    </div>
  );
}
