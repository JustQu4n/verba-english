import { BookOpenCheck, CheckCheck, ListChecks, PenLine, Shield, Sparkles, Trophy, UserPlus, Users } from "lucide-react";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { connection } from "next/server";
import { Suspense, type ComponentType } from "react";

import { AccountAvatar } from "@/components/admin/account-avatar";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { ForbiddenError, UnauthorizedError } from "@/core/errors";
import { Link } from "@/i18n/navigation";
import { listUsers } from "@/modules/admin/application/list-users";
import { getOverview } from "@/modules/admin/application/manage-user";
import { getContainer } from "@/server/container";

import { displayName } from "./users/account-list";

export const instant = false;

const TOP_COUNT = 5;

export default async function AdminOverviewPage({ params }: PageProps<"/[locale]/admin">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Admin.overview");
  const tCommon = await getTranslations("Dashboard");

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <AdminPageHeader title={t("title")} subtitle={t("subtitle")} />
      <Suspense fallback={<p className="text-muted-foreground">{tCommon("loading")}</p>}>
        <Overview />
      </Suspense>
    </div>
  );
}

async function Overview() {
  await connection();
  const [t, tCommon, format] = await Promise.all([getTranslations("Admin.overview"), getTranslations("Admin.common"), getFormatter()]);
  const { auth, roles, users } = await getContainer();
  const deps = { auth, roles, users };
  let data;
  try {
    const [overview, top, newest] = await Promise.all([
      getOverview(deps),
      listUsers(deps, { order: "points" }),
      listUsers(deps, { order: "created" }),
    ]);
    data = { overview, top: top.items.filter((a) => a.rank !== null).slice(0, TOP_COUNT), newest: newest.items.slice(0, TOP_COUNT) };
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) return null;
    throw error;
  }
  const { overview, top, newest } = data;
  const n = (value: number) => format.number(value);

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Users} label={t("stats.users")} value={n(overview.users)} note={t("stats.newUsers", { count: overview.newUsers7d })} />
        <Stat icon={Shield} label={t("stats.admins")} value={n(overview.admins)} note={t("stats.learners", { count: overview.users - overview.admins })} />
        <Stat icon={BookOpenCheck} label={t("stats.prompts")} value={n(overview.promptsPublished)} note={t("stats.drafts", { count: overview.promptsDraft })} />
        <Stat icon={Trophy} label={t("stats.ranked")} value={n(overview.rankedLearners)} note={t("stats.points", { count: overview.pointsTotal })} />
        <Stat icon={PenLine} label={t("stats.attempts")} value={n(overview.attempts)} />
        <Stat icon={CheckCheck} label={t("stats.completions")} value={n(overview.completions)} />
      </ul>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <MiniList title={t("top")} href="/admin/leaderboard" action={t("seeAll")} empty={tCommon("emptyBody")} rows={top.map((a) => ({ account: a, trailing: t("pointsShort", { count: a.points }), lead: String(a.rank) }))} />
        <MiniList title={t("newest")} href="/admin/users" action={t("seeAll")} empty={tCommon("emptyBody")} rows={newest.map((a) => ({ account: a, trailing: format.dateTime(a.createdAt, { dateStyle: "medium" }) }))} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild variant="outline"><Link href="/admin/prompts/new"><Sparkles aria-hidden="true" />{t("addPrompt")}</Link></Button>
        <Button asChild variant="outline"><Link href="/admin/prompts"><ListChecks aria-hidden="true" />{t("managePrompts")}</Link></Button>
        <Button asChild variant="outline"><Link href="/admin/users"><UserPlus aria-hidden="true" />{t("manageUsers")}</Link></Button>
      </div>
    </>
  );
}

function Stat({ icon: Icon, label, value, note }: { icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>; label: string; value: string; note?: string }) {
  return (
    <li className="rounded-2xl border p-5">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <p className="mt-2 text-3xl font-extrabold tracking-tight tabular-nums">{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </li>
  );
}

function MiniList({ title, href, action, empty, rows }: { title: string; href: "/admin/leaderboard" | "/admin/users"; action: string; empty: string; rows: { account: Parameters<typeof displayName>[0] & { id: string; avatarUrl: string | null }; trailing: string; lead?: string }[] }) {
  return (
    <section aria-label={title} className="rounded-2xl border">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="font-semibold tracking-tight">{title}</h2>
        <Link href={href} className="text-sm font-medium underline-offset-4 hover:underline">{action}</Link>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y">
          {rows.map(({ account, trailing, lead }) => (
            <li key={account.id}>
              <Link href={`/admin/users/${account.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/60">
                {lead && <span className="w-5 text-sm font-semibold tabular-nums text-muted-foreground">{lead}</span>}
                <AccountAvatar name={displayName(account)} avatarUrl={account.avatarUrl} className="size-8 text-xs" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{displayName(account)}</span>
                <span className="text-sm tabular-nums text-muted-foreground">{trailing}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
