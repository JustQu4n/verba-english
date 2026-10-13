import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export async function PromptFormHeader({ title }: { title: string }) {
  const t = await getTranslations("Admin.form");
  return (
    <div className="mb-8">
      <Link
        href="/admin/prompts"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t("back")}
      </Link>
      <h1 className="mt-5 text-4xl font-extrabold tracking-tighter italic sm:text-5xl">{title}</h1>
    </div>
  );
}
