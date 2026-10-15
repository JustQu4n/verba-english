"use client";

import { useTranslations } from "next-intl";
import { useActionState, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EmailFormState, ResendState } from "@/lib/auth-form";

import { resendConfirmationEmail, signInWithEmail, signUpWithEmail } from "./actions";
import { Field } from "./field";
import { PasswordInput } from "./password-input";

type Mode = "signin" | "signup";

function useErrorText() {
  const t = useTranslations("Login.formErrors");
  return (code?: string) => (code ? t(code) : undefined);
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      {message}
    </p>
  );
}

/** Button that sends the confirmation email again for `email`. */
function ResendButton({ email }: { email: string }) {
  const t = useTranslations("Login");
  const errorText = useErrorText();
  const [state, action, pending] = useActionState<ResendState, FormData>(resendConfirmationEmail, undefined);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="email" value={email} />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? t("resending") : t("resend")}
      </Button>
      <p role="status" className="min-h-5 text-sm text-muted-foreground">
        {state?.status === "sent" && t("resent")}
        {state?.status === "error" && <span className="text-destructive">{errorText(state.formError)}</span>}
      </p>
    </form>
  );
}

function SignInForm() {
  const t = useTranslations("Login");
  const errorText = useErrorText();
  const id = useId();
  const [state, action, pending] = useActionState<EmailFormState, FormData>(signInWithEmail, undefined);
  const [email, setEmail] = useState("");

  const errors = state?.status === "error" ? state.errors : undefined;
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormError message={errorText(errors?.formError)} />
      <Field id={`${id}-email`} label={t("email")} error={errorText(errors?.fieldErrors?.email)}>
        {(p) => (
          <Input {...p} name="email" type="email" autoComplete="email" inputMode="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} />
        )}
      </Field>
      <Field id={`${id}-password`} label={t("password")} error={errorText(errors?.fieldErrors?.password)}>
        {(p) => <PasswordInput {...p} name="password" autoComplete="current-password" required />}
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="h-11 rounded-full text-base">
        {pending ? t("signingIn") : t("signInSubmit")}
      </Button>
      {errors?.formError === "email_not_confirmed" && <ResendButton email={email} />}
    </form>
  );
}

function SignUpForm({ onReset }: { onReset: () => void }) {
  const t = useTranslations("Login");
  const errorText = useErrorText();
  const id = useId();
  const [state, action, pending] = useActionState<EmailFormState, FormData>(signUpWithEmail, undefined);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  if (state?.status === "confirm_email") {
    return (
      <div role="status" className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{t("checkEmailTitle")}</h2>
        <p className="leading-relaxed text-muted-foreground">{t("checkEmailBody", { email: state.email })}</p>
        <ResendButton email={state.email} />
        <button type="button" onClick={onReset} className="w-fit rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline">
          {t("useAnotherEmail")}
        </button>
      </div>
    );
  }

  const errors = state?.status === "error" ? state.errors : undefined;
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormError message={errorText(errors?.formError)} />
      <Field id={`${id}-name`} label={t("fullName")} error={errorText(errors?.fieldErrors?.fullName)}>
        {(p) => (
          <Input {...p} name="fullName" autoComplete="name" required maxLength={120}
            value={fullName} onChange={(e) => setFullName(e.target.value)} />
        )}
      </Field>
      <Field id={`${id}-email`} label={t("email")} error={errorText(errors?.fieldErrors?.email)}>
        {(p) => (
          <Input {...p} name="email" type="email" autoComplete="email" inputMode="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} />
        )}
      </Field>
      <Field id={`${id}-password`} label={t("password")} hint={t("passwordHint")} error={errorText(errors?.fieldErrors?.password)}>
        {(p) => <PasswordInput {...p} name="password" autoComplete="new-password" required />}
      </Field>
      <Field id={`${id}-confirm`} label={t("confirmPassword")} error={errorText(errors?.fieldErrors?.confirmPassword)}>
        {(p) => <PasswordInput {...p} name="confirmPassword" autoComplete="new-password" required />}
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="h-11 rounded-full text-base">
        {pending ? t("signingUp") : t("signUpSubmit")}
      </Button>
    </form>
  );
}

/** Tabs for signing in and creating an account with email and password. */
export function EmailAuthForms({ initialMode }: { initialMode: Mode }) {
  const t = useTranslations("Login");
  const id = useId();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [signUpKey, setSignUpKey] = useState(0); // remounting clears the "check your email" state
  const tabs: { mode: Mode; label: string }[] = [
    { mode: "signin", label: t("signInTab") },
    { mode: "signup", label: t("signUpTab") },
  ];

  return (
    <div>
      <div role="tablist" aria-label={t("emailTabsLabel")} className="grid grid-cols-2 rounded-lg bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab.mode}
            id={`${id}-${tab.mode}-tab`}
            role="tab"
            type="button"
            aria-selected={mode === tab.mode}
            aria-controls={`${id}-panel`}
            tabIndex={mode === tab.mode ? 0 : -1}
            onClick={() => setMode(tab.mode)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") setMode(mode === "signin" ? "signup" : "signin");
            }}
            className="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-selected:bg-background aria-selected:text-foreground aria-selected:shadow-sm"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${mode}-tab`} className="mt-6">
        {mode === "signin" ? <SignInForm /> : <SignUpForm key={signUpKey} onReset={() => setSignUpKey((k) => k + 1)} />}
      </div>
    </div>
  );
}
