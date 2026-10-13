import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { AuthButton, AuthButtonFallback } from "@/components/landing/auth-button";
import { LanguageSwitcher } from "@/components/landing/language-switcher";
import { Logo } from "@/components/landing/logo";

/** Top bar of the signed-in area: logo on the left, language and account on the right. */
export function DashboardHeader() {
  const t = useTranslations("Header");
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Logo className="text-lg" />
        <nav aria-label={t("navLabel")} className="flex items-center gap-1 sm:gap-3">
          <LanguageSwitcher />
          <Suspense fallback={<AuthButtonFallback />}>
            <AuthButton />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
