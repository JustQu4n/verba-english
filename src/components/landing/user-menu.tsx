"use client";

import { useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, LayoutDashboard, LogOut, Trophy, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import type { DisplayProfile } from "@/lib/profile-display";

function ProfileAvatar({ profile, className }: { profile: DisplayProfile; className?: string }) {
  return (
    <Avatar className={className}>
      {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt="" /> : null}
      <AvatarFallback>{profile.initials}</AvatarFallback>
    </Avatar>
  );
}

const ROW = "gap-3 rounded-xl px-2.5 py-2.5 text-sm";
const CHIP = "grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-foreground [&_svg]:size-5";

function MenuLink({ href, icon, title, hint }: { href: "/dashboard" | "/dashboard/leaderboard" | "/dashboard/profile"; icon: ReactNode; title: string; hint: string }) {
  return (
    <DropdownMenuItem asChild className={ROW}>
      <Link href={href}>
        <span className={CHIP}>{icon}</span>
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="font-semibold">{title}</span>
          <span className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</span>
        </span>
        <ChevronRight className="text-muted-foreground" aria-hidden="true" />
      </Link>
    </DropdownMenuItem>
  );
}

/** Profile menu in the nav bar: avatar, name, email, dashboard link, sign out. */
export function UserMenu({ profile }: { profile: DisplayProfile }) {
  const t = useTranslations();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <form ref={formRef} action="/auth/signout" method="post" hidden />
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={t("UserMenu.account", { name: profile.name })}
          className="flex max-w-64 items-center gap-2 rounded-full py-1 pr-2 pl-1 outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <ProfileAvatar profile={profile} />
          <span className="hidden min-w-0 flex-col text-left leading-tight md:flex">
            <span className="truncate text-sm font-semibold">{profile.name}</span>
            <span className="truncate text-xs text-muted-foreground">{profile.email}</span>
          </span>
          <ChevronDown className="hidden size-4 shrink-0 text-muted-foreground md:block" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[24rem] max-w-[calc(100vw-1.5rem)] rounded-2xl p-2 shadow-xl">
          <DropdownMenuLabel className="flex items-center gap-4 rounded-xl bg-inverse p-4 font-normal text-inverse-foreground">
            <ProfileAvatar profile={profile} className="size-14 ring-2 ring-inverse-foreground/30 [&_[data-slot=avatar-fallback]]:bg-inverse-foreground [&_[data-slot=avatar-fallback]]:font-bold [&_[data-slot=avatar-fallback]]:text-inverse" />
            <span className="flex min-w-0 flex-col gap-0.5 leading-tight">
              <span className="truncate text-base font-bold">{profile.name}</span>
              <span className="truncate text-[0.8125rem] text-inverse-foreground/65" title={profile.email}>{profile.email}</span>
            </span>
          </DropdownMenuLabel>
          <div className="mt-2 flex flex-col gap-1">
            <MenuLink href="/dashboard" icon={<LayoutDashboard />} title={t("UserMenu.dashboard")} hint={t("UserMenu.dashboardHint")} />
            <MenuLink href="/dashboard/profile" icon={<UserRound />} title={t("UserMenu.profile")} hint={t("UserMenu.profileHint")} />
            <MenuLink href="/dashboard/leaderboard" icon={<Trophy />} title={t("UserMenu.leaderboard")} hint={t("UserMenu.leaderboardHint")} />
          </div>
          <DropdownMenuSeparator className="my-2" />
          <DropdownMenuItem onSelect={() => formRef.current?.requestSubmit()} className={ROW}>
            <span className={CHIP}>
              <LogOut />
            </span>
            <span className="font-semibold">{t("Common.signOut")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
