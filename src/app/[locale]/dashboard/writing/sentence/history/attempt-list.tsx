import { ChevronLeft, ChevronRight } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { UnauthorizedError } from "@/core/errors";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { listAttempts } from "@/modules/writing/application/list-attempts";
import { getContainer } from "@/server/container";

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** The learner's graded attempts, newest first, with what they wrote and the feedback they got. */
export async function AttemptList({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Request-time work: the session, the query string and the clock (dates) are all read here.
  await connection();
  const raw = await searchParams;
  const [t, format] = await Promise.all([getTranslations("Sentence.history"), getFormatter()]);
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
          <li key={item.id} className="rounded-2xl border p-5">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <p className="flex flex-wrap items-center gap-2">
                <span>{t(`mode.${item.mode}`)}</span>
                {item.tries > 1 && <span>{t("tries", { count: item.tries })}</span>}
              </p>
              <time dateTime={item.createdAt.toISOString()}>{format.dateTime(item.createdAt, { dateStyle: "medium", timeStyle: "short" })}</time>
            </div>

            <p lang="vi" className="mt-3 text-lg/snug font-semibold">
              {item.vietnamese ?? <span className="font-normal text-muted-foreground">{t("removed")}</span>}
            </p>

            <p className="mt-3 text-xs text-muted-foreground">{t("yourAnswer")}</p>
            <p lang="en" className="mt-0.5 whitespace-pre-wrap break-words">{item.answer}</p>

            {(item.suggestion || item.improvements.length > 0 || item.comment) && (
              <div className="mt-4 space-y-2 rounded-lg bg-muted px-4 py-3 text-sm">
                {item.suggestion && (
                  <p>
                    <span className="font-semibold">{t("suggestion")}:</span> <span lang="en">{item.suggestion}</span>
                  </p>
                )}
                {item.improvements.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5">
                    {item.improvements.map((note, index) => (
                      <li key={index}>{note}</li>
                    ))}
                  </ul>
                )}
                {item.comment && <p className="text-muted-foreground">{item.comment}</p>}
              </div>
            )}
          </li>
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
