import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { Link } from "@/i18n/navigation";

import { AuthButton, AuthButtonFallback } from "./auth-button";
import { ThemeToggle } from "@/components/theme-toggle";

import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";

const NAV = [
  { href: "#cach-hoat-dong", key: "howItWorks" },
  { href: "#cach-cham", key: "modes" },
  { href: "#tinh-nang", key: "features" },
  { href: "#hoi-dap", key: "faq" },
] as const;

export function SiteHeader() {
  const t = useTranslations("Header");
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Logo className="text-lg" />
        <nav aria-label={t("navLabel")} className="flex items-center gap-1 sm:gap-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:block"
            >
              {t(item.key)}
            </Link>
          ))}
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
