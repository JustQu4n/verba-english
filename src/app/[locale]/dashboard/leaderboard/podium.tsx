import { Crown } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { pickInitials } from "@/lib/profile-display";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/modules/leaderboard/domain/leaderboard";

export async function LearnerAvatar({ entry, className }: { entry: LeaderboardEntry; className?: string }) {
  const tProfile = await getTranslations("Profile");
  const name = entry.name ?? tProfile("anonymous");
  return (
    <Avatar className={className}>
      {entry.avatarUrl ? <AvatarImage src={entry.avatarUrl} alt="" /> : null}
      <AvatarFallback className="font-bold">{pickInitials(name)}</AvatarFallback>
    </Avatar>
  );
}

// `place` is the index in the ranking (0 = first). SLOT is indexed by place.
const SLOT = [
  { place: 0, plinth: "h-28 sm:h-36", avatar: "size-16 sm:size-24", tone: "bg-solid text-on-solid" },
  { place: 1, plinth: "h-20 sm:h-24", avatar: "size-12 sm:size-20", tone: "bg-muted text-foreground" },
  { place: 2, plinth: "h-14 sm:h-16", avatar: "size-12 sm:size-20", tone: "bg-muted text-foreground" },
] as const;

/** The first three on a podium. Fewer than three learners simply leave the other stands empty. */
export async function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const [t, tProfile] = await Promise.all([getTranslations("Leaderboard"), getTranslations("Profile")]);
  // Left to right: second, first, third, so the first sits in the middle and stands tallest.
  const order = [SLOT[1], SLOT[0], SLOT[2]];
  return (
    <ol className="mt-10 grid grid-cols-3 items-end gap-2 sm:gap-5" aria-label={t("podium")}>
      {order.map((slot) => {
        const entry = entries[slot.place];
        const first = slot.place === 0;
        if (!entry) return <li key={slot.place} aria-hidden="true" />;
        return (
          <li key={slot.place} className="flex min-w-0 flex-col items-center text-center">
            {first && <Crown className="mb-1 size-6 sm:size-8" aria-hidden="true" />}
            <LearnerAvatar
              entry={entry}
              className={cn(slot.avatar, "ring-2 ring-offset-2 ring-offset-background", entry.isMe ? "ring-foreground" : "ring-border")}
            />
            <p className="mt-3 line-clamp-2 w-full break-words text-sm font-semibold leading-tight sm:text-base">
              {entry.name ?? tProfile("anonymous")}
            </p>
            {entry.isMe && (
              <span className="mt-1 rounded-full bg-solid px-2 py-0.5 text-[0.65rem] font-bold text-on-solid">{t("you")}</span>
            )}
            <p className="mt-1 text-xs tabular-nums text-muted-foreground sm:text-sm">{t("points", { count: entry.points })}</p>
            <div
              className={cn(
                "mt-3 grid w-full place-items-center rounded-t-2xl",
                slot.plinth,
                slot.tone
              )}
            >
              <span className="display text-4xl sm:text-6xl">{entry.rank}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
