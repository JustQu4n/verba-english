"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState, useState } from "react";

import { GoogleIcon } from "@/components/landing/google-icon";
import { LanguageSwitcher } from "@/components/landing/language-switcher";
import { Logo } from "@/components/landing/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";

import { login, loginWithGoogle, signup } from "./actions";

const CALLBACK_ERRORS = ["oauth_failed", "missing_code", "auth_failed"] as const;

function BrandPanel() {
  const t = useTranslations("Login");
  return (
    <aside className="notebook relative hidden overflow-hidden bg-navy lg:block" aria-hidden="true">
      <div className="absolute inset-0 bg-navy" />
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0, transparent 55px, #9db4ff 55px, #9db4ff 56px)",
        }}
      />
      <div className="absolute inset-y-0 left-20 w-0.5 bg-margin/70" />
      <div className="relative flex h-full flex-col justify-between py-12 pl-28 pr-12 text-white">
        <Logo className="text-xl text-white" />
        <div>
          <p className="font-hand text-5xl leading-[1.2]">
            Today I will write
            <br />
            one more sentence.
          </p>
          <p className="mt-6 max-w-[34ch] text-white/70">
            {t("brandLine")}
          </p>
        </div>
      </div>
    </aside>
  );
}

function LoginPanel() {
  const t = useTranslations("Login");
  const tCommon = useTranslations("Common");
  const [loginState, loginAction, loginPending] = useActionState(login, undefined);
  const [signupState, signupAction, signupPending] = useActionState(signup, undefined);
  const [googleState, googleAction, googlePending] = useActionState(loginWithGoogle, undefined);
  const [emailOpen, setEmailOpen] = useState(false);
  const errorCode = useSearchParams().get("error");
  const callbackError = CALLBACK_ERRORS.find((c) => c === errorCode);

  const emailState = signupState ?? loginState;
  const googleError = googleState?.error ?? (callbackError ? t(`errors.${callbackError}`) : undefined);
  const showEmail = emailOpen || Boolean(emailState?.error || emailState?.message);
  const busy = loginPending || signupPending || googlePending;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col px-5 py-10 sm:px-0">
      <Link
        href="/"
        className="mb-10 w-fit rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:hidden"
      >
        {t("backHome")}
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">{t("welcome")}</h1>
      <p className="mt-3 leading-relaxed text-muted-foreground">
        {t("intro")}
      </p>

      {googleError && (
        <p role="alert" className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {googleError}
        </p>
      )}

      <form action={googleAction} className="mt-8">
        <Button
          type="submit"
          variant="outline"
          size="lg"
          disabled={busy}
          className="h-12 w-full gap-3 border-input bg-white text-base font-semibold shadow-sm hover:bg-secondary"
        >
          <GoogleIcon className="size-5" />
          {googlePending ? t("redirecting") : t("continueWithGoogle")}
        </Button>
      </form>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {t("googleNote")}
      </p>

      <div className="mt-10 border-t border-rule pt-6">
        <button
          type="button"
          onClick={() => setEmailOpen((v) => !v)}
          aria-expanded={showEmail}
          aria-controls="email-form"
          className="rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {showEmail ? t("hideEmail") : t("showEmail")}
        </button>

        {showEmail && (
          <form id="email-form" className="mt-4 flex flex-col gap-3">
            <label className="sr-only" htmlFor="email">{t("email")}</label>
            <Input id="email" name="email" type="email" placeholder={t("email")} autoComplete="email" required />
            <label className="sr-only" htmlFor="password">{t("password")}</label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={t("passwordPlaceholder")}
              autoComplete="current-password"
              minLength={6}
              required
            />
            <Button formAction={loginAction} disabled={busy}>
              {tCommon("signIn")}
            </Button>
            <Button variant="outline" formAction={signupAction} disabled={busy}>
              {t("createAccount")}
            </Button>
            {emailState?.error && (
              <p role="alert" className="text-sm text-destructive">
                {emailState.error}
              </p>
            )}
            {emailState?.message && <p className="text-sm text-muted-foreground">{emailState.message}</p>}
          </form>
        )}
      </div>
    </div>
  );
}

export function LoginView() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <BrandPanel />
      <div className="relative flex items-center">
        <LanguageSwitcher className="absolute right-4 top-4" />
        <Suspense>
          <LoginPanel />
        </Suspense>
      </div>
    </main>
  );
}
