import { Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

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
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter italic sm:text-5xl">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild size="lg">
          <Link href="/admin/prompts/new">
            <Plus aria-hidden="true" />
            {t("add")}
          </Link>
        </Button>
      </div>
      <Suspense fallback={<p className="text-muted-foreground">{tCommon("loading")}</p>}>
        <PromptList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
