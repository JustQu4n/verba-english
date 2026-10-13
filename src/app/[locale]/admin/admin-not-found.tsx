import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

/** What non-admins see in the admin area. It reveals nothing about what lives here. */
export async function AdminNotFound() {
  const t = await getTranslations("Admin.notFound");
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8">
      <p className="text-6xl font-extrabold tracking-tighter italic">404</p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{t("body")}</p>
      <Link href="/dashboard" className="mt-6 inline-block text-sm font-semibold underline underline-offset-4">
        {t("home")}
      </Link>
    </div>
  );
}
