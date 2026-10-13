import { unstable_rethrow } from "next/navigation";

import { AppError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "@/core/errors";

export type PromptField = "level" | "category" | "vietnamese" | "hint" | "answers";

const FIELDS: readonly string[] = ["level", "category", "vietnamese", "hint", "answers"];

/** Error codes for the prompt form: per-field codes and an optional form-wide code. All are translatable. */
export interface PromptFormErrors {
  formError?: string;
  fieldErrors?: Partial<Record<PromptField, string>>;
}

/** What the form shows again after a failed save: exactly what the admin typed. */
export interface AnswerFormValues {
  text: string;
  structureVi: string;
  structureEn: string;
}

export interface PromptFormValues {
  level: string;
  category: string;
  vietnamese: string;
  hint: string;
  published: boolean;
  answers: AnswerFormValues[];
}

export type PromptFormState = undefined | { status: "error"; errors: PromptFormErrors; values: PromptFormValues };

const text = (data: FormData, name: string) => {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
};

const texts = (data: FormData, name: string) => data.getAll(name).map((value) => (typeof value === "string" ? value : ""));

/** Zips the repeated answer fields into rows; a row left completely blank is dropped. */
function readAnswers(data: FormData): AnswerFormValues[] {
  const text = texts(data, "answerText");
  const structureVi = texts(data, "answerStructureVi");
  const structureEn = texts(data, "answerStructureEn");
  return text
    .map((value, index) => ({ text: value, structureVi: structureVi[index] ?? "", structureEn: structureEn[index] ?? "" }))
    .filter((row) => [row.text, row.structureVi, row.structureEn].some((field) => field.trim() !== ""));
}

/** Reads the create/edit form. Validation happens in the use case; here we only keep the raw values. */
export function readPromptForm(data: FormData) {
  const values: PromptFormValues = {
    level: text(data, "level"),
    category: text(data, "category"),
    vietnamese: text(data, "vietnamese"),
    hint: text(data, "hint"),
    published: data.get("published") === "on",
    answers: readAnswers(data),
  };
  return { input: values, values };
}

export function toPromptFormErrors(error: unknown): PromptFormErrors {
  if (error instanceof ValidationError && Array.isArray(error.details)) {
    const fieldErrors: NonNullable<PromptFormErrors["fieldErrors"]> = {};
    for (const issue of error.details as { path?: PropertyKey[]; message?: string }[]) {
      const field = issue.path?.[0];
      if (typeof field === "string" && FIELDS.includes(field) && issue.message) {
        fieldErrors[field as PromptField] ??= issue.message;
      }
    }
    if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  }
  if (error instanceof UnauthorizedError) return { formError: "unauthorized" };
  if (error instanceof ForbiddenError) return { formError: "forbidden" };
  if (error instanceof NotFoundError) return { formError: "not_found" };
  // Next control-flow errors (redirect, dynamic API) must propagate to the framework.
  if (!(error instanceof AppError)) unstable_rethrow(error);
  console.error(error);
  return { formError: "unknown" };
}
