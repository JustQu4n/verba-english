import { getTranslations, setRequestLocale } from "next-intl/server";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ForbiddenError, NotFoundError, UnauthorizedError } from "@/core/errors";
import { getPrompt } from "@/modules/writing/application/get-prompt";
import { getContainer } from "@/server/container";

import { updatePromptAction } from "../actions";
import { PromptForm } from "../prompt-form";
import { PromptFormHeader } from "../prompt-form-header";

async function EditPrompt({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const { auth, roles, prompts } = await getContainer();
  const prompt = await getPrompt({ auth, roles, prompts }, id).catch((error) => {
    if (error instanceof NotFoundError) return notFound();
    // The admin gate already shows the right screen for these.
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) return null;
    throw error;
  });
  if (!prompt) return null;
  const t = await getTranslations("Admin.form");

  return (
    <>
      <PromptFormHeader title={t("editTitle")} />
      <PromptForm
        mode="edit"
        action={updatePromptAction.bind(null, id)}
        initial={{
          level: prompt.level,
          category: prompt.category,
          vietnamese: prompt.vietnamese,
          hint: prompt.hint,
          published: prompt.published,
          answers: prompt.answers.map((answer) => ({ ...answer })),
        }}
      />
    </>
  );
}

export const instant = false;

export default async function EditPromptPage({ params }: PageProps<"/[locale]/admin/prompts/[id]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Dashboard");
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <Suspense fallback={<p className="text-muted-foreground">{t("loading")}</p>}>
        <EditPrompt params={params} />
      </Suspense>
    </div>
  );
}
