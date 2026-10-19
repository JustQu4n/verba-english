import { ChevronRight } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { UnauthorizedError } from "@/core/errors";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { toDisplayProfile, type DisplayProfile } from "@/lib/profile-display";
import { getCredits } from "@/modules/credits/application/get-credits";
import { getMyStanding } from "@/modules/leaderboard/application/get-my-standing";
import { getPoints } from "@/modules/points/application/get-points";
import { getMyProfile } from "@/modules/profile/application/get-my-profile";
import { listAttempts } from "@/modules/writing/application/list-attempts";
import type { AttemptRecord } from "@/modules/writing/domain/attempt";
import { getContainer } from "@/server/container";

import { AttemptCard } from "../writing/sentence/history/attempt-card";
import { AppearanceForm } from "./appearance-form";
import { AvatarEditor } from "./avatar-editor";
import { NameForm } from "./name-form";

/** How many of the latest attempts the profile shows; the rest are one click away. */
const RECENT_ATTEMPTS = 5;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border p-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="display mt-1 text-3xl tabular-nums">{value}</dd>
    </div>
  );
}

/** Account details, ranking and recent attempts of the signed-in learner. Reads the session, so wrap it in <Suspense>. */
export async function ProfileView() {
  // Request-time work: the session, the numbers and the clock (dates) are all read here.
  await connection();
  const { auth, profiles, credits, points, leaderboard, attempts } = await getContainer();
  const tProfile = await getTranslations("Profile");

  let me;
  try {
    me = await getMyProfile({ auth, profiles });
  } catch (error) {
    // The dashboard gate already shows the sign-in screen; there is nothing to show.
    if (error instanceof UnauthorizedError) return null;
    throw error;
  }

  // The numbers are extras: when one cannot be read the rest of the page still works.
  const [standing, balance, totalPoints, recent] = await Promise.all([
    getMyStanding({ auth, leaderboard }).catch(() => null),
    getCredits({ auth, credits }).catch(() => null),
    getPoints({ auth, points }).catch(() => null),
    listAttempts({ auth, attempts }, { page: 1 }),
  ]);

  const display = toDisplayProfile(me.user, me.profile, tProfile("anonymous"));
  return (
    <ProfileContent
      data={{
        display,
        fullName: me.profile?.fullName?.trim() ?? "",
        joinedAt: me.profile?.createdAt ?? null,
        accentColor: me.profile?.accentColor ?? null,
        points: totalPoints,
        credits: balance,
        attemptsTotal: recent.total,
        attempts: recent.items,
        standing,
      }}
    />
  );
}

export interface ProfileData {
  display: DisplayProfile;
  fullName: string;
  joinedAt: Date | null;
  /** The saved accent colour (#rrggbb) or null for the default black. */
  accentColor: string | null;
  points: number | null;
  credits: number | null;
  attemptsTotal: number;
  /** The latest attempts, newest first. */
  attempts: AttemptRecord[];
  standing: { rank: number; points: number } | null;
}

/** What the profile looks like for data that is already loaded. */
export async function ProfileContent({ data }: { data: ProfileData }) {
  const [t, format] = await Promise.all([getTranslations("ProfilePage"), getFormatter()]);
  const { display, standing } = data;
  const joined = data.joinedAt ? format.dateTime(data.joinedAt, { dateStyle: "long" }) : null;
  const number = (value: number | null) => (value === null ? "–" : format.number(value));

  return (
    <div className="mt-8 flex flex-col gap-10">
      <section aria-label={t("identity")} className="flex flex-col items-center gap-6 rounded-3xl bg-inverse p-6 text-inverse-foreground sm:flex-row sm:items-start sm:gap-8 sm:p-8">
        <AvatarEditor initials={display.initials} avatarUrl={display.avatarUrl} />
        <div className="flex min-w-0 flex-col gap-1 text-center sm:pt-2 sm:text-left">
          <h2 className="display break-words text-3xl sm:text-4xl">{display.name}</h2>
          <p className="truncate text-inverse-foreground/70" title={display.email}>
            {display.email}
          </p>
          {joined && <p className="mt-2 text-sm text-inverse-foreground/60">{t("memberSince", { date: joined })}</p>}
        </div>
      </section>

      <dl className="grid grid-cols-3 gap-3" aria-label={t("stats")}>
        <Stat label={t("points")} value={number(data.points)} />
        <Stat label={t("credits")} value={number(data.credits)} />
        <Stat label={t("attempts")} value={format.number(data.attemptsTotal)} />
      </dl>

      <section aria-labelledby="ranking-title">
        <h2 id="ranking-title" className="text-xl font-bold tracking-tight">
          {t("ranking")}
        </h2>
        {standing ? (
          <Link
            href="/dashboard/leaderboard"
            className="mt-3 flex items-center gap-5 rounded-2xl border p-5 transition-colors hover:border-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span className="display text-5xl tabular-nums sm:text-6xl">#{standing.rank}</span>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="font-semibold">{t("rankPoints", { points: standing.points })}</span>
              <span className="mt-1 text-sm text-muted-foreground">{t("rankHint")}</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed p-5">
            <p className="font-semibold">{t("noRank")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("noRankBody")}</p>
            <Button asChild className="mt-4 rounded-full">
              <Link href="/dashboard/writing/sentence">{t("startPractice")}</Link>
            </Button>
          </div>
        )}
      </section>

      <section aria-labelledby="details-title">
        <h2 id="details-title" className="text-xl font-bold tracking-tight">
          {t("details")}
        </h2>
        <div className="mt-3 flex flex-col gap-5 rounded-2xl border p-5">
          <NameForm initialName={data.fullName} />
          <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("email")}</p>
              <p className="mt-1 truncate text-muted-foreground" title={display.email}>
                {display.email || "–"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">{t("joined")}</p>
              <p className="mt-1 text-muted-foreground">{joined ?? "–"}</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="appearance-title">
        <h2 id="appearance-title" className="text-xl font-bold tracking-tight">
          {t("appearance.title")}
        </h2>
        <div className="mt-3 rounded-2xl border p-5">
          <AppearanceForm initialColor={data.accentColor} />
        </div>
      </section>

      <section aria-labelledby="attempts-title">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="attempts-title" className="text-xl font-bold tracking-tight">
            {t("recentAttempts")}
          </h2>
          {data.attemptsTotal > RECENT_ATTEMPTS && (
            <Link href="/dashboard/writing/sentence/history" className="text-sm font-medium underline-offset-4 hover:underline">
              {t("viewAll", { count: data.attemptsTotal })}
            </Link>
          )}
        </div>
        {data.attempts.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed px-6 py-10 text-center">
            <p className="font-semibold">{t("noAttempts")}</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{t("noAttemptsBody")}</p>
            <Button asChild className="mt-4 rounded-full">
              <Link href="/dashboard/writing/sentence">{t("startPractice")}</Link>
            </Button>
          </div>
        ) : (
          <ol className="mt-3 flex flex-col gap-4">
            {data.attempts.slice(0, RECENT_ATTEMPTS).map((item) => (
              <AttemptCard key={item.id} item={item} />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
