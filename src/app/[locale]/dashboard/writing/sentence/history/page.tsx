import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { Link } from "@/i18n/navigation";

import { AttemptList } from "./attempt-list";

// The locale param is only known per request; see the dashboard layout.
export const instant = false;

export default async function AttemptHistoryPage({ params, searchParams }: PageProps<"/[locale]/dashboard/writing/sentence/history">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Sentence.history");
  const tCommon = await getTranslations("Dashboard");

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        href="/dashboard/writing/sentence"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t("back")}
      </Link>
      <h1 className="mt-6 text-4xl font-extrabold tracking-tighter italic sm:text-5xl">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("intro")}</p>
      <Suspense fallback={<p className="mt-8 text-muted-foreground">{tCommon("loading")}</p>}>
        <AttemptList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
