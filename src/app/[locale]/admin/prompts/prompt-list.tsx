import { Pencil, Plus, Search } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { ForbiddenError, UnauthorizedError, ValidationError } from "@/core/errors";
import { AdminPagination } from "@/components/admin/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Link } from "@/i18n/navigation";
import { listPrompts, type PromptList as PromptListResult } from "@/modules/writing/application/list-prompts";
import { CATEGORIES, LEVELS } from "@/modules/writing/domain/sentence-catalog";
import { getContainer } from "@/server/container";

import { deletePromptAction } from "./actions";
import { DeletePromptButton } from "./delete-prompt-button";

type SearchParams = Record<string, string | string[] | undefined>;

const FILTER_KEYS = ["query", "level", "category", "status"] as const;
const FLASH = ["created", "updated", "deleted"] as const;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

type Filters = Record<(typeof FILTER_KEYS)[number] | "page", string | undefined>;

function filtersFrom(raw: SearchParams): Filters {
  return {
    query: first(raw.query),
    level: first(raw.level),
    category: first(raw.category),
    status: first(raw.status),
    page: first(raw.page),
  };
}

export async function PromptList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  // Request-time work: the session, the query string and the clock (dates) are all read here.
  await connection();
  const raw = await searchParams;
  const [t, tSentence, format] = await Promise.all([
    getTranslations("Admin.prompts"),
    getTranslations("Sentence"),
    getFormatter(),
  ]);
  const { auth, roles, prompts } = await getContainer();
  const deps = { auth, roles, prompts };

  // A hand-edited URL with an unknown filter value shows the unfiltered list instead of an error page.
  let filters: Filters = filtersFrom(raw);
  let result: PromptListResult;
  try {
    try {
      result = await listPrompts(deps, filters);
    } catch (error) {
      if (!(error instanceof ValidationError)) throw error;
      filters = { query: undefined, level: undefined, category: undefined, status: undefined, page: undefined };
      result = await listPrompts(deps, filters);
    }
  } catch (error) {
    // The admin gate already shows the right screen for these; there is nothing to list.
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) return null;
    throw error;
  }

  const saved = FLASH.find((key) => key === first(raw.saved));
  const errorCode = first(raw.error);
  const hasFilter = FILTER_KEYS.some((key) => Boolean(filters[key]));
  const pageHref = (page: number) => ({
    pathname: "/admin/prompts" as const,
    query: {
      ...Object.fromEntries(FILTER_KEYS.flatMap((key) => (filters[key] ? [[key, filters[key]]] : []))),
      ...(page > 1 ? { page: String(page) } : {}),
    },
  });

  return (
    <>
      {saved && (
        <p role="status" className="mb-6 rounded-md border bg-muted px-4 py-3 text-sm font-medium">
          {t(`flash.${saved}`)}
        </p>
      )}
      {errorCode && (
        <p role="alert" className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {t(`flash.error`, { reason: t(`errors.${["unauthorized", "forbidden", "not_found"].includes(errorCode) ? errorCode : "unknown"}`) })}
        </p>
      )}

      <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1.4fr_1fr_auto]" role="search">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            name="query"
            defaultValue={filters.query ?? ""}
            placeholder={t("filters.search")}
            aria-label={t("filters.search")}
            className="pl-9"
          />
        </div>
        <NativeSelect name="level" defaultValue={filters.level ?? ""} aria-label={t("filters.level")}>
          <option value="">{t("filters.allLevels")}</option>
          {LEVELS.map((level) => (
            <option key={level} value={level}>
              {tSentence(`levels.${level}.name`)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect name="category" defaultValue={filters.category ?? ""} aria-label={t("filters.category")}>
          <option value="">{t("filters.allCategories")}</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {tSentence(`categories.${category}`)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect name="status" defaultValue={filters.status ?? ""} aria-label={t("filters.status")}>
          <option value="">{t("filters.allStatuses")}</option>
          <option value="published">{t("published")}</option>
          <option value="draft">{t("draft")}</option>
        </NativeSelect>
        <div className="flex gap-2">
          <Button type="submit" variant="outline">
            {t("filters.apply")}
          </Button>
          {hasFilter && (
            <Button asChild variant="ghost">
              <Link href="/admin/prompts">{t("filters.reset")}</Link>
            </Button>
          )}
        </div>
      </form>

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {t("count", { count: result.total })}
      </p>

      {result.items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed px-6 py-16 text-center">
          <p className="text-lg font-semibold tracking-tight">{hasFilter ? t("emptyFiltered") : t("empty")}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {hasFilter ? t("emptyFilteredBody") : t("emptyBody")}
          </p>
          {!hasFilter && (
            <Button asChild className="mt-6">
              <Link href="/admin/prompts/new">
                <Plus aria-hidden="true" />
                {t("add")}
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border">
          <table className="block w-full text-left text-sm md:table">
            <caption className="sr-only">{t("title")}</caption>
            <thead className="hidden border-b bg-muted/60 text-xs font-semibold text-muted-foreground md:table-header-group">
              <tr>
                <th scope="col" className="px-4 py-3">{t("columns.sentence")}</th>
                <th scope="col" className="px-4 py-3">{t("columns.level")}</th>
                <th scope="col" className="px-4 py-3">{t("columns.category")}</th>
                <th scope="col" className="px-4 py-3">{t("columns.status")}</th>
                <th scope="col" className="px-4 py-3">{t("columns.updated")}</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">{t("columns.actions")}</span></th>
              </tr>
            </thead>
            <tbody className="block divide-y md:table-row-group">
              {result.items.map((prompt) => {
                const status = prompt.published ? t("published") : t("draft");
                return (
                  <tr key={prompt.id} className="block px-4 py-4 md:table-row md:px-0 md:py-0">
                    <td className="block md:table-cell md:max-w-md md:px-4 md:py-3 md:align-top">
                      <p lang="vi" className="font-medium">{prompt.vietnamese}</p>
                      <p lang="en" className="mt-0.5 text-xs text-muted-foreground">{prompt.hint}</p>
                      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground md:hidden">
                        <StatusBadge published={prompt.published} label={status} />
                        <span>{tSentence(`levels.${prompt.level}.name`)}</span>
                        <span aria-hidden="true">/</span>
                        <span>{tSentence(`categories.${prompt.category}`)}</span>
                      </p>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 align-top md:table-cell">{tSentence(`levels.${prompt.level}.name`)}</td>
                    <td className="hidden px-4 py-3 align-top md:table-cell">{tSentence(`categories.${prompt.category}`)}</td>
                    <td className="hidden px-4 py-3 align-top md:table-cell"><StatusBadge published={prompt.published} label={status} /></td>
                    <td className="hidden whitespace-nowrap px-4 py-3 align-top text-muted-foreground md:table-cell">
                      {format.dateTime(prompt.updatedAt, { dateStyle: "medium" })}
                    </td>
                    <td className="mt-3 block md:mt-0 md:table-cell md:px-4 md:py-2 md:text-right md:align-top">
                      <span className="inline-flex gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/prompts/${prompt.id}`}>
                            <Pencil aria-hidden="true" />
                            {t("edit")}
                            <span className="sr-only">: {prompt.vietnamese}</span>
                          </Link>
                        </Button>
                        <DeletePromptButton text={prompt.vietnamese} action={deletePromptAction.bind(null, prompt.id)} />
                      </span>
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

/** Published = solid black, draft = outline, so the state reads without colour. */
function StatusBadge({ published, label }: { published: boolean; label: string }) {
  return (
    <span
      className={
        published
          ? "inline-block rounded-full bg-solid px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-on-solid"
          : "inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
      }
    >
      {label}
    </span>
  );
}
