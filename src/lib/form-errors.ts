import { unstable_rethrow } from "next/navigation";

import { AppError, ValidationError } from "@/core/errors";
import { isAuthErrorCode } from "@/modules/auth/application/auth-errors";

export type FieldName = "fullName" | "email" | "password" | "confirmPassword";

/** Error codes for a form: per-field errors and an optional form-wide error. All are translatable codes. */
export interface FormErrors {
  formError?: string;
  fieldErrors?: Partial<Record<FieldName, string>>;
}

const FIELDS: readonly string[] = ["fullName", "email", "password", "confirmPassword"];

interface IssueLike {
  path?: readonly PropertyKey[];
  message?: string;
}

/** First message per field from zod-style issues. */
export function fieldErrorsFromIssues(issues: readonly IssueLike[]): FormErrors["fieldErrors"] {
  const fieldErrors: NonNullable<FormErrors["fieldErrors"]> = {};
  for (const issue of issues) {
    const field = issue.path?.[0];
    if (typeof field === "string" && FIELDS.includes(field) && issue.message) {
      fieldErrors[field as FieldName] ??= issue.message;
    }
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}

/** Converts an error from an auth use case into codes the form can translate. */
export function toFormErrors(error: unknown): FormErrors {
  if (error instanceof ValidationError && Array.isArray(error.details)) {
    const fieldErrors = fieldErrorsFromIssues(error.details);
    if (fieldErrors) return { fieldErrors };
  }
  if (error instanceof AppError && isAuthErrorCode(error.message)) {
    return { formError: error.message };
  }
  // Next control-flow errors (redirect, dynamic API) must propagate to the framework.
  unstable_rethrow(error);
  console.error(error);
  return { formError: "unknown" };
}
