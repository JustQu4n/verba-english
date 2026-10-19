import { ArrowUpRight } from "lucide-react";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { connection } from "next/server";
import { Suspense } from "react";

import { UnauthorizedError } from "@/core/errors";
import { Link, redirect } from "@/i18n/navigation";
import { toDisplayProfile } from "@/lib/profile-display";
import { getMyProfile } from "@/modules/profile/application/get-my-profile";
import { getContainer } from "@/server/container";

async function Greeting() {
  // Opt in to request-time rendering before anything reads the clock (next-intl does).
  await connection();
  const { auth, profiles } = await getContainer();
  const me = await getMyProfile({ auth, profiles }).catch((error) => {
    if (error instanceof UnauthorizedError) return null;
    throw error;
  });
  const [t, tProfile, locale] = await Promise.all([
    getTranslations("Dashboard"),
    getTranslations("Profile"),
    getLocale(),
  ]);
  if (!me) return redirect({ href: "/login", locale });

  const { name } = toDisplayProfile(me.user, me.profile, tProfile("anonymous"));
  return <>{t("greeting", { name })}</>;
}

// The locale param is only known per request; these routes are prerendered for every
// locale by generateStaticParams, so allow this segment to block instead of streaming it.
export const instant = false;

export default async function DashboardPage({ params }: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Dashboard");

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="text-4xl font-extrabold tracking-tighter text-balance italic sm:text-6xl">
        <Suspense fallback={t("loading")}>
          <Greeting />
        </Suspense>
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">{t("intro")}</p>

      <section aria-labelledby="writing-heading" className="mt-14">
        <h2 id="writing-heading" className="text-xl font-semibold tracking-tight">
          {t("writing")}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard/writing/sentence"
            className="group flex min-h-48 flex-col justify-between rounded-2xl bg-solid p-6 text-on-solid transition-transform hover:-translate-y-0.5 focus-visible:outline-offset-4 sm:p-8"
          >
            <span className="flex items-start justify-between gap-4">
              <span className="text-3xl font-extrabold tracking-tighter italic">{t("sentenceTitle")}</span>
              <ArrowUpRight className="size-6 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </span>
            <span className="max-w-xs text-base/relaxed text-on-solid/75">{t("sentenceBody")}</span>
          </Link>

          <div
            aria-disabled="true"
            className="flex min-h-48 flex-col justify-between rounded-2xl border border-dashed p-6 text-muted-foreground sm:p-8"
          >
            <span className="flex items-start justify-between gap-4">
              <span className="text-3xl font-extrabold tracking-tighter italic">{t("paragraphTitle")}</span>
              <span className="rounded-full border px-3 py-1 text-xs font-medium">{t("soon")}</span>
            </span>
            <span className="max-w-xs text-base/relaxed">{t("paragraphBody")}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
