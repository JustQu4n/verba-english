"use server";

import { getLocale } from "next-intl/server";
import { headers } from "next/headers";
import { redirect as redirectExternal } from "next/navigation";

import { redirect } from "@/i18n/navigation";
import { toActionError } from "@/lib/action-error";
import {
  type EmailFormState,
  readSignInForm,
  readSignUpForm,
  type ResendState,
} from "@/lib/auth-form";
import { toFormErrors } from "@/lib/form-errors";
import { resolveSiteUrl } from "@/lib/site-url";
import { resendConfirmation } from "@/modules/auth/application/resend-confirmation";
import { signIn } from "@/modules/auth/application/sign-in";
import { startGoogleSignIn } from "@/modules/auth/application/sign-in-with-google";
import { signUp } from "@/modules/auth/application/sign-up";
import { getContainer } from "@/server/container";

export type AuthState = { error?: string } | undefined;

const callbackUrl = async () => `${resolveSiteUrl(await headers())}/auth/callback`;

export async function signInWithEmail(
  _: EmailFormState,
  formData: FormData
): Promise<EmailFormState> {
  const { input, values } = readSignInForm(formData);
  try {
    const { auth } = await getContainer();
    await signIn(auth, input);
  } catch (error) {
    return { status: "error", errors: toFormErrors(error), values };
  }
  redirect({ href: "/dashboard", locale: await getLocale() });
}

export async function signUpWithEmail(
  _: EmailFormState,
  formData: FormData
): Promise<EmailFormState> {
  const form = readSignUpForm(formData);
  if (!form.ok) return { status: "error", errors: form.errors, values: form.values };

  let needsEmailConfirmation: boolean;
  try {
    const { auth } = await getContainer();
    ({ needsEmailConfirmation } = await signUp(auth, form.input, await callbackUrl()));
  } catch (error) {
    return { status: "error", errors: toFormErrors(error), values: form.values };
  }

  if (needsEmailConfirmation) {
    return { status: "confirm_email", email: form.input.email.trim().toLowerCase() };
  }
  redirect({ href: "/dashboard", locale: await getLocale() });
}

export async function resendConfirmationEmail(
  _: ResendState,
  formData: FormData
): Promise<ResendState> {
  try {
    const { auth } = await getContainer();
    await resendConfirmation(auth, { email: formData.get("email") }, await callbackUrl());
  } catch (error) {
    return { status: "error", formError: toFormErrors(error).formError ?? "email_invalid" };
  }
  return { status: "sent" };
}

export async function loginWithGoogle(): Promise<AuthState> {
  let url: string;
  try {
    const { auth } = await getContainer();
    url = await startGoogleSignIn(auth, await callbackUrl());
  } catch (error) {
    return { error: toActionError(error) };
  }
  redirectExternal(url); // Google's URL: no locale prefix
}
