"use server";

import { getLocale } from "next-intl/server";

import { ForbiddenError, InfrastructureError, UnauthorizedError, ValidationError } from "@/core/errors";
import { redirect } from "@/i18n/navigation";
import { type AnswerFormValues, type PromptFormState, readPromptForm, toPromptFormErrors } from "@/lib/prompt-form";
import { createPrompt } from "@/modules/writing/application/create-prompt";
import { unstable_rethrow } from "next/navigation";

import { deletePrompt } from "@/modules/writing/application/delete-prompt";
import { suggestAnswers } from "@/modules/writing/application/suggest-answers";
import { updatePrompt } from "@/modules/writing/application/update-prompt";
import { getContainer } from "@/server/container";

const LIST = "/admin/prompts";

async function backToList(query: Record<string, string>): Promise<never> {
  return redirect({ href: { pathname: LIST, query }, locale: await getLocale() });
}

export async function createPromptAction(_: PromptFormState, formData: FormData): Promise<PromptFormState> {
  const { input, values } = readPromptForm(formData);
  try {
    const { auth, roles, prompts } = await getContainer();
    await createPrompt({ auth, roles, prompts }, input);
  } catch (error) {
    return { status: "error", errors: toPromptFormErrors(error), values };
  }
  return backToList({ saved: "created" });
}

export async function updatePromptAction(
  id: string,
  _: PromptFormState,
  formData: FormData
): Promise<PromptFormState> {
  const { input, values } = readPromptForm(formData);
  try {
    const { auth, roles, prompts } = await getContainer();
    await updatePrompt({ auth, roles, prompts }, id, input);
  } catch (error) {
    return { status: "error", errors: toPromptFormErrors(error), values };
  }
  return backToList({ saved: "updated" });
}

export async function deletePromptAction(id: string): Promise<void> {
  try {
    const { auth, roles, prompts } = await getContainer();
    await deletePrompt({ auth, roles, prompts }, id);
  } catch (error) {
    return backToList({ error: toPromptFormErrors(error).formError ?? "unknown" });
  }
  return backToList({ saved: "deleted" });
}

export type SuggestAnswersResult =
  | { status: "ok"; answers: AnswerFormValues[]; keywords: string[] }
  | { status: "error"; reason: "unauthorized" | "forbidden" | "invalid" | "unavailable" | "unknown" };

/** Asks the AI to draft accepted answers and key words for the sentence in the form. Nothing is saved: the admin reviews first. */
export async function suggestAnswersAction(input: unknown): Promise<SuggestAnswersResult> {
  try {
    const { auth, roles, prompts, suggester } = await getContainer();
    const { answers, keywords } = await suggestAnswers({ auth, roles, prompts, suggester }, input);
    return { status: "ok", answers: [...answers], keywords };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { status: "error", reason: "unauthorized" };
    if (error instanceof ForbiddenError) return { status: "error", reason: "forbidden" };
    if (error instanceof ValidationError) return { status: "error", reason: "invalid" };
    if (error instanceof InfrastructureError) {
      console.error(`Answer suggestion failed: ${error.message}`);
      return { status: "error", reason: "unavailable" };
    }
    unstable_rethrow(error);
    console.error(error);
    return { status: "error", reason: "unknown" };
  }
}
