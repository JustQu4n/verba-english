"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { nextTheme, THEME_ATTRIBUTE, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

/**
 * Switches between light and dark. The icon is chosen by CSS (the `data-theme` attribute set before paint), so server and
 * browser render the same markup and nothing flashes. The choice is kept in localStorage; a blocked store only
 * means the choice is not remembered.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("Common");

  function toggle() {
    const root = document.documentElement;
    const current: Theme = root.getAttribute(THEME_ATTRIBUTE) === "dark" ? "dark" : "light";
    const next = nextTheme(current);
    root.setAttribute(THEME_ATTRIBUTE, next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Not remembered, still switched for this visit.
    }
  }

  return (
    <Button type="button" variant="ghost" size="icon" onClick={toggle} aria-label={t("toggleTheme")} title={t("toggleTheme")} className={cn(className)}>
      <Moon className="size-5 dark:hidden" aria-hidden="true" />
      <Sun className="hidden size-5 dark:block" aria-hidden="true" />
    </Button>
  );
}
