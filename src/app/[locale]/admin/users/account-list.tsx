import { Pencil, Search } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { AccountAvatar } from "@/components/admin/account-avatar";
import { AdminPagination } from "@/components/admin/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { ForbiddenError, UnauthorizedError, ValidationError } from "@/core/errors";
import { Link } from "@/i18n/navigation";
import { listUsers, type UserListResult } from "@/modules/admin/application/list-users";
import { ACCOUNT_ROLES, USER_ORDERS, type UserAccount } from "@/modules/admin/domain/user-account";
import { getContainer } from "@/server/container";

type SearchParams = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** `users` is the account manager; `leaderboard` is the same accounts ranked by points. */
export type AccountListMode = "users" | "leaderboard";

interface Filters {
  query?: string;
  role?: string;
  order?: string;
  page?: string;
}

export async function AccountList({ mode, searchParams }: { mode: AccountListMode; searchParams: Promise<SearchParams> }) {
  await connection();
  const raw = await searchParams;
  const [t, tCommon, format] = await Promise.all([getTranslations(`Admin.${mode}`), getTranslations("Admin.common"), getFormatter()]);
  const { auth, roles, users } = await getContainer();
  const deps = { auth, roles, users };
  const board = mode === "leaderboard";

  const fromUrl: Filters = { query: first(raw.query), role: board ? undefined : first(raw.role), order: board ? "points" : first(raw.order), page: first(raw.page) };
  let filters = fromUrl;
  let result: UserListResult;
  try {
    try {
      result = await listUsers(deps, filters);
    } catch (error) {
      // A hand-edited URL with an unknown value shows the unfiltered list rather than an error page.
      if (!(error instanceof ValidationError)) throw error;
      filters = { order: board ? "points" : undefined };
      result = await listUsers(deps, filters);
    }
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) return null;
    throw error;
  }

  const hasFilter = Boolean(filters.query || filters.role || (!board && filters.order && filters.order !== "created"));
  const base = board ? ("/admin/leaderboard" as const) : ("/admin/users" as const);
  const pageHref = (page: number) => ({
    pathname: base,
    query: {
      ...(filters.query ? { query: filters.query } : {}),
      ...(!board && filters.role ? { role: filters.role } : {}),
      ...(!board && filters.order && filters.order !== "created" ? { order: filters.order } : {}),
      ...(page > 1 ? { page: String(page) } : {}),
    },
  });
  const saved = first(raw.saved) === "1";

  return (
    <>
      {saved && (
        <p role="status" className="mb-6 rounded-md border bg-muted px-4 py-3 text-sm font-medium">
          {tCommon("saved")}
        </p>
      )}

      <form method="get" role="search" className={board ? "flex flex-wrap gap-3" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]"}>
        <div className={board ? "relative min-w-0 flex-1 basis-64" : "relative sm:col-span-2 lg:col-span-1"}>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input name="query" defaultValue={filters.query ?? ""} placeholder={tCommon("search")} aria-label={tCommon("search")} maxLength={100} className="pl-9" />
        </div>
        {!board && (
          <>
            <NativeSelect name="role" defaultValue={filters.role ?? ""} aria-label={t("filters.role")}>
              <option value="">{t("filters.allRoles")}</option>
              {ACCOUNT_ROLES.map((role) => (
                <option key={role} value={role}>
                  {tCommon(`roles.${role}`)}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect name="order" defaultValue={filters.order ?? "created"} aria-label={t("filters.order")}>
              {USER_ORDERS.map((order) => (
                <option key={order} value={order}>
                  {t(`filters.orders.${order}`)}
                </option>
              ))}
            </NativeSelect>
          </>
        )}
        <div className="flex gap-2">
          <Button type="submit" variant="outline">
            {tCommon("filter")}
          </Button>
          {hasFilter && (
            <Button asChild variant="ghost">
              <Link href={base}>{tCommon("reset")}</Link>
            </Button>
          )}
        </div>
      </form>

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {t("count", { count: result.total })}
      </p>

      {result.items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed px-6 py-16 text-center">
          <p className="text-lg font-semibold tracking-tight">{tCommon("empty")}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{tCommon("emptyBody")}</p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border">
          <table className="block w-full text-left text-sm md:table">
            <caption className="sr-only">{t("title")}</caption>
            <thead className="hidden border-b bg-muted/60 text-xs font-semibold text-muted-foreground md:table-header-group">
              <tr>
                {board && <th scope="col" className="w-20 px-4 py-3">{t("columns.rank")}</th>}
                <th scope="col" className="px-4 py-3">{t("columns.user")}</th>
                {!board && <th scope="col" className="px-4 py-3">{t("columns.role")}</th>}
                <th scope="col" className="px-4 py-3 text-right">{t("columns.points")}</th>
                {!board && <th scope="col" className="px-4 py-3 text-right">{t("columns.credits")}</th>}
                <th scope="col" className="px-4 py-3">{t("columns.joined")}</th>
                {!board && <th scope="col" className="px-4 py-3">{t("columns.lastSignIn")}</th>}
                <th scope="col" className="px-4 py-3"><span className="sr-only">{t("columns.actions")}</span></th>
              </tr>
            </thead>
            <tbody className="block divide-y md:table-row-group">
              {result.items.map((account) => {
                const name = displayName(account);
                return (
                  <tr key={account.id} className="relative block px-4 py-4 md:table-row md:px-0 md:py-0">
                    {board && (
                      <td className="absolute top-4 right-4 md:static md:table-cell md:px-4 md:py-3 md:align-middle">
                        <RankBadge rank={account.rank} label={account.rank ? tCommon("rank", { rank: account.rank }) : tCommon("unranked")} />
                      </td>
                    )}
                    <td className="block md:table-cell md:px-4 md:py-3 md:align-middle">
                      <div className="flex min-w-0 items-center gap-3 max-md:pr-16">
                        <AccountAvatar name={name} avatarUrl={account.avatarUrl} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{name}</p>
                          {account.email && account.email !== name && <p className="truncate text-xs text-muted-foreground">{account.email}</p>}
                        </div>
                      </div>
                    </td>
                    {!board && (
                      <td className="mt-3 block md:mt-0 md:table-cell md:px-4 md:py-3 md:align-middle">
                        <RoleBadge role={account.role} label={tCommon(`roles.${account.role}`)} />
                      </td>
                    )}
                    <td className="mt-3 flex justify-between gap-4 tabular-nums md:mt-0 md:table-cell md:px-4 md:py-3 md:text-right md:align-middle">
                      <span className="text-muted-foreground md:hidden">{t("columns.points")}</span>
                      <span className="font-semibold">{format.number(account.points)}</span>
                    </td>
                    {!board && (
                      <td className="mt-1 flex justify-between gap-4 tabular-nums md:mt-0 md:table-cell md:px-4 md:py-3 md:text-right md:align-middle">
                        <span className="text-muted-foreground md:hidden">{t("columns.credits")}</span>
                        <span>{format.number(account.credits)}</span>
                      </td>
                    )}
                    <td className="mt-1 flex justify-between gap-4 text-muted-foreground md:mt-0 md:table-cell md:px-4 md:py-3 md:align-middle md:whitespace-nowrap">
                      <span className="md:hidden">{t("columns.joined")}</span>
                      <span>{format.dateTime(account.createdAt, { dateStyle: "medium" })}</span>
                    </td>
                    {!board && (
                      <td className="mt-1 flex justify-between gap-4 text-muted-foreground md:mt-0 md:table-cell md:px-4 md:py-3 md:align-middle md:whitespace-nowrap">
                        <span className="md:hidden">{t("columns.lastSignIn")}</span>
                        <span>{account.lastSignInAt ? format.dateTime(account.lastSignInAt, { dateStyle: "medium" }) : tCommon("never")}</span>
                      </td>
                    )}
                    <td className="mt-3 block md:mt-0 md:table-cell md:px-4 md:py-2 md:text-right md:align-middle">
                      <Button asChild variant="outline" size="sm" className="max-md:w-full">
                        <Link href={`/admin/users/${account.id}`}>
                          <Pencil aria-hidden="true" />
                          {t("manage")}
                          <span className="sr-only">: {name}</span>
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AdminPagination page={result.page} pageCount={result.pageCount} hrefFor={pageHref} />
    </>
  );
}

export const displayName = (account: Pick<UserAccount, "fullName" | "email">) =>
  account.fullName?.trim() || account.email?.split("@")[0] || "—";

/** Admin = solid black, user = outline, so the role reads without colour. */
export function RoleBadge({ role, label }: { role: UserAccount["role"]; label: string }) {
  return (
    <span
      className={
        role === "admin"
          ? "inline-block rounded-full bg-solid px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-on-solid"
          : "inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
      }
    >
      {label}
    </span>
  );
}

/** The podium (1–3) is filled; the rest are outlined; no points yet shows a dash. */
function RankBadge({ rank, label }: { rank: number | null; label: string }) {
  if (!rank) return <span className="text-muted-foreground" aria-label={label}>—</span>;
  return (
    <span
      aria-label={label}
      className={
        rank <= 3
          ? "inline-flex size-8 items-center justify-center rounded-full bg-solid text-sm font-bold tabular-nums text-on-solid"
          : "inline-flex size-8 items-center justify-center rounded-full border text-sm font-semibold tabular-nums"
      }
    >
      {rank}
    </span>
  );
}
