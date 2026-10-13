import { setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";

export const instant = false;

export default async function AdminIndexPage({ params }: PageProps<"/[locale]/admin">) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect({ href: "/admin/prompts", locale });
}
