import { signUpSchema } from "@/modules/auth/application/credentials";

import { type FormErrors, fieldErrorsFromIssues } from "./form-errors";

/** What a form action returns to its form. Never contains passwords. */
export type EmailFormState =
  | undefined
  | { status: "error"; errors: FormErrors; values: { fullName?: string; email: string } }
  | { status: "confirm_email"; email: string };

export type ResendState = undefined | { status: "sent" } | { status: "error"; formError: string };

const text = (data: FormData, name: string) => {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
};

export function readSignInForm(data: FormData) {
  const email = text(data, "email");
  return { input: { email, password: text(data, "password") }, values: { email } };
}

type SignUpRead =
  | { ok: true; input: { fullName: string; email: string; password: string }; values: { fullName: string; email: string } }
  | { ok: false; errors: FormErrors; values: { fullName: string; email: string } };

/** Reads the sign-up form, checking every field (and the password confirmation) in one pass. */
export function readSignUpForm(data: FormData): SignUpRead {
  const input = { fullName: text(data, "fullName"), email: text(data, "email"), password: text(data, "password") };
  const values = { fullName: input.fullName, email: input.email };

  const parsed = signUpSchema.safeParse(input);
  const fieldErrors = parsed.success ? {} : (fieldErrorsFromIssues(parsed.error.issues) ?? {});
  if (text(data, "confirmPassword") !== input.password) fieldErrors.confirmPassword = "password_mismatch";

  if (Object.keys(fieldErrors).length > 0) return { ok: false, errors: { fieldErrors }, values };
  return { ok: true, input, values };
}
