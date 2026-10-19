import { getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { UnauthorizedError } from "@/core/errors";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { Leaderboard } from "@/modules/leaderboard/domain/leaderboard";
import { getLeaderboard } from "@/modules/leaderboard/application/get-leaderboard";
import { getContainer } from "@/server/container";

import { LearnerAvatar, Podium } from "./podium";

/** Podium for the first three, a list for the rest, and my own standing. Reads the session, so wrap it in <Suspense>. */
export async function LeaderboardView() {
  // Request-time work: the session and the ranking are read here.
  await connection();
  const { auth, leaderboard } = await getContainer();

  let board;
  try {
    board = await getLeaderboard({ auth, leaderboard });
  } catch (error) {
    // The dashboard gate already shows the sign-in screen; there is nothing to show.
    if (error instanceof UnauthorizedError) return null;
    throw error;
  }

  return <Board board={board} />;
}

/** What the board looks like for a ranking that is already loaded. */
export async function Board({ board }: { board: Leaderboard }) {
  const [t, tProfile] = await Promise.all([getTranslations("Leaderboard"), getTranslations("Profile")]);
  const { entries, me } = board;
  if (entries.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed px-6 py-16 text-center">
        <p className="text-lg font-semibold tracking-tight">{t("empty")}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{t("emptyBody")}</p>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/dashboard/writing/sentence">{t("startPractice")}</Link>
        </Button>
      </div>
    );
  }

  const rest = entries.slice(3);
  const outside = me !== null && !entries.some((e) => e.isMe);
  return (
    <>
      <Podium entries={entries.slice(0, 3)} />

      {rest.length > 0 && (
        <ol className="mt-8 flex flex-col gap-2" aria-label={t("list")}>
          {rest.map((entry) => (
            <li
              key={entry.rank + (entry.name ?? "") + entry.points}
              className={cn("flex items-center gap-3 rounded-2xl border px-4 py-3", entry.isMe && "border-foreground bg-muted")}
            >
              <span className="display w-9 shrink-0 text-2xl tabular-nums">{entry.rank}</span>
              <LearnerAvatar entry={entry} className="size-10" />
              <span className="min-w-0 flex-1 truncate font-semibold">
                {entry.name ?? tProfile("anonymous")}
                {entry.isMe && (
                  <span className="ml-2 rounded-full bg-solid px-2 py-0.5 align-middle text-[0.65rem] font-bold text-on-solid">{t("you")}</span>
                )}
              </span>
              <span className="shrink-0 text-sm font-medium tabular-nums">{t("points", { count: entry.points })}</span>
            </li>
          ))}
        </ol>
      )}

      {outside && me && (
        <p className="mt-6 rounded-2xl bg-inverse px-5 py-4 text-inverse-foreground" role="status">
          <span className="display text-2xl">#{me.rank}</span>
          <span className="ml-3 text-sm">{t("yourStanding", { points: me.points })}</span>
        </p>
      )}
      {me === null && (
        <p className="mt-6 text-sm text-muted-foreground" role="status">
          {t("noPointsYet")}
        </p>
      )}
    </>
  );
}
