import { getTranslations, setRequestLocale } from "next-intl/server";

import { createPromptAction } from "../actions";
import { PromptForm } from "../prompt-form";
import { PromptFormHeader } from "../prompt-form-header";

export const instant = false;

export default async function NewPromptPage({ params }: PageProps<"/[locale]/admin/prompts/new">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Admin.form");
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <PromptFormHeader title={t("newTitle")} />
      <PromptForm mode="create" action={createPromptAction} />
    </div>
  );
}
