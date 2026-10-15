import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { AuthButton, AuthButtonFallback } from "@/components/landing/auth-button";
import { LanguageSwitcher } from "@/components/landing/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/landing/logo";
import { Link } from "@/i18n/navigation";

/** Top bar of the admin area: same logo as the rest of the app, marked with an Admin badge. */
export function AdminHeader() {
  const t = useTranslations("Admin");
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Logo className="text-lg" />
          <span className="rounded-md bg-foreground px-2 py-0.5 text-xs font-semibold text-background">{t("badge")}</span>
        </div>
        <nav aria-label={t("navLabel")} className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/admin/prompts"
            className="hidden rounded-md px-3 py-2 text-sm font-semibold underline decoration-2 underline-offset-8 sm:block"
          >
            {t("nav.prompts")}
          </Link>
          <Link
            href="/dashboard"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            {t("nav.dashboard")}
          </Link>
          <ThemeToggle />
          <LanguageSwitcher />
          <Suspense fallback={<AuthButtonFallback />}>
            <AuthButton />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
