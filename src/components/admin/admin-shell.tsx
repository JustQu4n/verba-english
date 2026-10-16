import { useTranslations } from "next-intl";
import { Suspense, type ReactNode } from "react";

import { AuthButton, AuthButtonFallback } from "@/components/landing/auth-button";
import { LanguageSwitcher } from "@/components/landing/language-switcher";
import { Logo } from "@/components/landing/logo";
import { ThemeToggle } from "@/components/theme-toggle";

import { AdminMobileNav } from "./admin-mobile-nav";
import { AdminNav } from "./admin-nav";

/**
 * Frame of the admin area: a black menu on the left (a button on narrow screens) and a top bar with
 * theme, language and the account menu. Pages render in the wide column on the right.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations("Admin");
  return (
    <div className="theme-mono min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-3 focus:py-2 focus:text-sm focus:text-background"
      >
        {t("skipToContent")}
      </a>
      <aside className="hidden h-screen flex-col gap-6 bg-inverse p-4 text-inverse-foreground lg:sticky lg:top-0 lg:flex">
        <div className="flex items-center gap-3 px-1 pt-1">
          <Logo className="text-lg" />
          <span className="rounded-md bg-inverse-foreground px-2 py-0.5 text-xs font-bold text-inverse">{t("badge")}</span>
        </div>
        <AdminNav />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
          <div className="relative flex h-16 items-center justify-between gap-3 px-4 sm:px-8">
            <div className="flex items-center gap-2 lg:hidden">
              <AdminMobileNav />
              <Logo className="text-base" />
              <span className="hidden rounded-md bg-foreground px-2 py-0.5 text-xs font-semibold text-background min-[480px]:inline">{t("badge")}</span>
            </div>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-1 sm:gap-3">
              <ThemeToggle />
              <LanguageSwitcher />
              <Suspense fallback={<AuthButtonFallback />}>
                <AuthButton />
              </Suspense>
            </div>
          </div>
        </header>
        <main id="main" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
