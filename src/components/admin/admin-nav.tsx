"use client";

import { ExternalLink, LayoutDashboard, ListChecks, Trophy, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", key: "overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/prompts", key: "prompts", icon: ListChecks, exact: false },
  { href: "/admin/users", key: "users", icon: Users, exact: false },
  { href: "/admin/leaderboard", key: "leaderboard", icon: Trophy, exact: false },
] as const;

const ROW = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-inverse-foreground/40";

/** Left-hand menu of the admin area. The page you are on is filled in, so it reads without colour. */
export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("Admin");
  const pathname = usePathname();

  return (
    <nav aria-label={t("navLabel")} className="flex flex-1 flex-col gap-1">
      {ITEMS.map(({ href, key, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              ROW,
              active
                ? "bg-inverse-foreground text-inverse"
                : "text-inverse-foreground/70 hover:bg-inverse-foreground/10 hover:text-inverse-foreground"
            )}
          >
            <Icon className="size-[1.15rem] shrink-0" aria-hidden="true" />
            {t(`nav.${key}`)}
          </Link>
        );
      })}
      <div className="mt-auto pt-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={cn(ROW, "border border-inverse-foreground/20 font-medium text-inverse-foreground/80 hover:bg-inverse-foreground/10 hover:text-inverse-foreground")}
        >
          <ExternalLink className="size-[1.15rem] shrink-0" aria-hidden="true" />
          {t("nav.dashboard")}
        </Link>
      </div>
    </nav>
  );
}
