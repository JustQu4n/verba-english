"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { redirect as redirectExternal } from "next/navigation";

import { redirect } from "@/i18n/navigation";
import { toActionError } from "@/lib/action-error";
import { getSiteUrl } from "@/lib/site-url";
import { signIn } from "@/modules/auth/application/sign-in";
import { startGoogleSignIn } from "@/modules/auth/application/sign-in-with-google";
import { signUp } from "@/modules/auth/application/sign-up";
import { getContainer } from "@/server/container";

export type AuthState = { error?: string; message?: string } | undefined;

function readCredentials(formData: FormData) {
  return { email: formData.get("email"), password: formData.get("password") };
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  try {
    const { auth } = await getContainer();
    await signIn(auth, readCredentials(formData));
  } catch (error) {
    return { error: toActionError(error) };
  }
  redirect({ href: "/dashboard", locale: await getLocale() });
}

export async function signup(_: AuthState, formData: FormData): Promise<AuthState> {
  let needsEmailConfirmation: boolean;
  try {
    const { auth } = await getContainer();
    ({ needsEmailConfirmation } = await signUp(
      auth,
      readCredentials(formData),
      `${getSiteUrl()}/auth/callback`
    ));
  } catch (error) {
    return { error: toActionError(error) };
  }

  if (needsEmailConfirmation) {
    const t = await getTranslations("Login");
    return { message: t("checkEmail") };
  }
  redirect({ href: "/dashboard", locale: await getLocale() });
}

export async function loginWithGoogle(): Promise<AuthState> {
  let url: string;
  try {
    const { auth } = await getContainer();
    url = await startGoogleSignIn(auth, `${getSiteUrl()}/auth/callback`);
  } catch (error) {
    return { error: toActionError(error) };
  }
  redirectExternal(url); // Google URL, no locale prefix added
}
