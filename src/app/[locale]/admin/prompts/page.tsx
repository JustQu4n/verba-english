import { Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

import { PromptList } from "./prompt-list";

export const instant = false;

export default async function AdminPromptsPage({ params, searchParams }: PageProps<"/[locale]/admin/prompts">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Admin.prompts");
  const tCommon = await getTranslations("Dashboard");

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <AdminPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <Button asChild size="lg">
            <Link href="/admin/prompts/new">
              <Plus aria-hidden="true" />
              {t("add")}
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<p className="text-muted-foreground">{tCommon("loading")}</p>}>
        <PromptList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
