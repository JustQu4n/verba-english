"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";

import { GoogleIcon } from "@/components/landing/google-icon";
import { LanguageSwitcher } from "@/components/landing/language-switcher";
import { Logo } from "@/components/landing/logo";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

import { loginWithGoogle } from "./actions";
import { EmailAuthForms } from "./email-auth-forms";

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
  const [googleState, googleAction, googlePending] = useActionState(loginWithGoogle, undefined);
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const callbackError = CALLBACK_ERRORS.find((c) => c === errorCode);
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";

  const googleError = googleState?.error ?? (callbackError ? t(`errors.${callbackError}`) : undefined);

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
          disabled={googlePending}
          className="h-12 w-full gap-3 border-input bg-white text-base font-semibold shadow-sm hover:bg-secondary"
        >
          <GoogleIcon className="size-5" />
          {googlePending ? t("redirecting") : t("continueWithGoogle")}
        </Button>
      </form>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {t("googleNote")}
      </p>

      <div className="my-8 flex items-center gap-4 text-sm text-muted-foreground" role="separator">
        <span className="h-px flex-1 bg-rule" />
        {t("orUseEmail")}
        <span className="h-px flex-1 bg-rule" />
      </div>

      <EmailAuthForms initialMode={initialMode} />
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
