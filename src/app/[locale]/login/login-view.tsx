"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState, type CSSProperties } from "react";

import { GoogleIcon } from "@/components/landing/google-icon";
import { LanguageSwitcher } from "@/components/landing/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/landing/logo";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

import { loginWithGoogle } from "./actions";
import { EmailAuthForms } from "./email-auth-forms";

const CALLBACK_ERRORS = ["oauth_failed", "missing_code", "auth_failed"] as const;

function BrandPanel() {
  const t = useTranslations("Login");
  return (
    <aside className="relative hidden overflow-hidden bg-inverse text-inverse-foreground lg:block" aria-hidden="true">
      <div className="flex h-full flex-col justify-between p-12 xl:p-16">
        <Logo className="text-xl" />
        <div>
          <p className="display text-[clamp(3rem,5vw,4.5rem)] text-balance">
            Write it.
            <br />
            Fix it.
            <br />
            Own it.
          </p>
          <p lang="en" className="mt-10 text-xl/9 text-inverse-foreground/90">
            Last weekend I{" "}
            <span className="relative inline-block" style={{ "--d": "0.8s" } as CSSProperties}>
              <span className="lp-strike">have went</span>
              <span className="lp-fix">went</span>
            </span>{" "}
            to my grandma&apos;s house.
          </p>
          <p className="mt-6 max-w-[34ch] text-inverse-foreground/60">{t("brandLine")}</p>
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
      <Logo className="mb-6 text-lg lg:hidden" />
      <Link
        href="/"
        className="mb-10 w-fit rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {t("backHome")}
      </Link>
      <h1 className="display text-5xl">{t("welcome")}</h1>
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
          className="h-12 w-full gap-3 rounded-full border-input bg-white text-base font-semibold text-neutral-900 shadow-sm hover:bg-neutral-100 hover:text-neutral-900"
        >
          <GoogleIcon className="size-5" />
          {googlePending ? t("redirecting") : t("continueWithGoogle")}
        </Button>
      </form>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {t("googleNote")}
      </p>

      <div className="my-8 flex items-center gap-4 text-sm text-muted-foreground" role="separator">
        <span className="h-px flex-1 bg-border" />
        {t("orUseEmail")}
        <span className="h-px flex-1 bg-border" />
      </div>

      <EmailAuthForms initialMode={initialMode} />
    </div>
  );
}

export function LoginView() {
  return (
    <main className="theme-mono landing grid min-h-screen bg-background text-foreground lg:grid-cols-[1fr_1.1fr]">
      <BrandPanel />
      <div className="relative flex items-center">
        <div className="absolute right-4 top-4 flex items-center gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <Suspense>
          <LoginPanel />
        </Suspense>
      </div>
    </main>
  );
}
