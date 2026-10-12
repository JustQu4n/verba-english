"use client";

import { Check, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

const LABELS: Record<Locale, { short: string; name: string }> = {
  vi: { short: "VI", name: "Tiếng Việt" },
  en: { short: "EN", name: "English" },
};

/** Switches language while staying on the current page. next-intl remembers the choice via the NEXT_LOCALE cookie. */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const t = useTranslations("Common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("language")}
        disabled={pending}
        className={`flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 ${className}`}
      >
        <Languages className="size-4" aria-hidden="true" />
        {LABELS[locale].short}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {routing.locales.map((l) => (
          <DropdownMenuItem
            key={l}
            lang={l}
            onSelect={() => startTransition(() => router.replace(pathname, { locale: l }))}
          >
            {LABELS[l].name}
            {l === locale && <Check className="ml-auto" aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
