import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { AccentLoader } from "@/components/dashboard/accent-loader";
import { CreditsProvider } from "@/components/dashboard/credits-context";
import { CreditsLoader } from "@/components/dashboard/credits-loader";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

import { DashboardGate } from "./dashboard-gate";

// Same reason as the root layout: the locale param is only known per request.
export const instant = false;

function SkipLink() {
  const t = useTranslations("Common");
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-solid focus:px-3 focus:py-2 focus:text-sm focus:text-on-solid"
    >
      {t("skipToContent")}
    </a>
  );
}

export default async function DashboardLayout({ children, params }: LayoutProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="theme-mono flex min-h-screen flex-col bg-background text-foreground">
      <CreditsProvider>
        <Suspense fallback={null}>
          <CreditsLoader />
        </Suspense>
        <Suspense fallback={null}>
          <AccentLoader />
        </Suspense>
        <SkipLink />
        <DashboardHeader />
        <main id="main" className="flex-1">
          <Suspense fallback={null}>
            <DashboardGate>{children}</DashboardGate>
          </Suspense>
        </main>
      </CreditsProvider>
    </div>
  );
}
