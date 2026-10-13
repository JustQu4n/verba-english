import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { AuthButton, AuthButtonFallback } from "@/components/landing/auth-button";
import { LanguageSwitcher } from "@/components/landing/language-switcher";
import { Logo } from "@/components/landing/logo";

import { HeaderCredits, HeaderPoints } from "./credits-context";

/** Top bar of the signed-in area: logo on the left, language, points, credits and account on the right. */
export function DashboardHeader() {
  const t = useTranslations("Header");
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-8">
        <Logo className="text-lg" />
        <nav aria-label={t("navLabel")} className="flex items-center gap-0.5 sm:gap-3">
          <LanguageSwitcher />
          <HeaderPoints />
          <HeaderCredits />
          <Suspense fallback={<AuthButtonFallback />}>
            <AuthButton />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
