"use server";

import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { type PromptFormState, readPromptForm, toPromptFormErrors } from "@/lib/prompt-form";
import { createPrompt } from "@/modules/writing/application/create-prompt";
import { deletePrompt } from "@/modules/writing/application/delete-prompt";
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
