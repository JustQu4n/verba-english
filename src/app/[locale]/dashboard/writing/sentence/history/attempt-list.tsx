import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { UnauthorizedError } from "@/core/errors";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { listAttempts } from "@/modules/writing/application/list-attempts";
import { getContainer } from "@/server/container";

import { AttemptCard } from "./attempt-card";

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** The learner's graded attempts, newest first, with what they wrote and the feedback they got. */
export async function AttemptList({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Request-time work: the session, the query string and the clock (dates) are all read here.
  await connection();
  const raw = await searchParams;
  const t = await getTranslations("Sentence.history");
  const { auth, attempts } = await getContainer();

  let result;
  try {
    result = await listAttempts({ auth, attempts }, { page: first(raw.page) });
  } catch (error) {
    // The dashboard gate already shows the sign-in screen; there is nothing to list.
    if (error instanceof UnauthorizedError) return null;
    throw error;
  }

  const pageHref = (page: number) => ({
    pathname: "/dashboard/writing/sentence/history" as const,
    query: page > 1 ? { page: String(page) } : {},
  });

  if (result.items.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed px-6 py-16 text-center">
        <p className="text-lg font-semibold tracking-tight">{t("empty")}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{t("emptyBody")}</p>
        <Button asChild className="mt-6">
          <Link href="/dashboard/writing/sentence">{t("startPractice")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <p className="mt-8 text-sm text-muted-foreground" aria-live="polite">
        {t("count", { count: result.total })}
      </p>
      <ol className="mt-4 flex flex-col gap-4">
        {result.items.map((item) => (
          <AttemptCard key={item.id} item={item} />
        ))}
      </ol>

      {result.pageCount > 1 && (
        <nav aria-label={t("pagination")} className="mt-8 flex items-center justify-between gap-3">
          {result.page > 1 ? (
            <Button asChild variant="outline">
              <Link href={pageHref(result.page - 1)}>
                <ChevronLeft aria-hidden="true" />
                {t("previous")}
              </Link>
            </Button>
          ) : (
            <span />
          )}
          <p className="text-sm tabular-nums text-muted-foreground">{t("pageOf", { page: result.page, pageCount: result.pageCount })}</p>
          {result.page < result.pageCount ? (
            <Button asChild variant="outline">
              <Link href={pageHref(result.page + 1)}>
                {t("next")}
                <ChevronRight aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
