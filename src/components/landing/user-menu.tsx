"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, LayoutDashboard, LogOut } from "lucide-react";

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
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="flex items-center gap-3 font-normal">
            <ProfileAvatar profile={profile} className="size-10" />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-semibold">{profile.name}</span>
              <span className="truncate text-xs text-muted-foreground">{profile.email}</span>
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard">
              <LayoutDashboard />
              {t("UserMenu.dashboard")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => formRef.current?.requestSubmit()}>
            <LogOut />
            {t("Common.signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
