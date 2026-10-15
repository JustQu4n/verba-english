"use client";

import { useTranslations } from "next-intl";
import { useActionState, useId } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { ACCOUNT_ROLES, MAX_CREDITS, MAX_POINTS, type AccountRole } from "@/modules/admin/domain/user-account";

import { type UserFormField, type UserFormState } from "./actions";

interface UserFormProps {
  action: (state: UserFormState, formData: FormData) => Promise<UserFormState>;
  initial: { role: AccountRole; credits: number; points: number };
  /** An admin cannot change their own role: the choice is shown but locked. */
  isSelf: boolean;
}

/** Role, credits and points of one account. Nothing changes until Save. */
export function UserForm({ action, initial, isSelf }: UserFormProps) {
  const t = useTranslations("Admin.users.form");
  const id = useId();
  const [state, formAction, pending] = useActionState<UserFormState, FormData>(action, undefined);
  const error = state?.status === "error" ? state : null;
  const message = (field: UserFormField) =>
    error?.field === field && error.code ? (t.has(`errors.${error.code}`) ? t(`errors.${error.code}`) : t("errors.unknown")) : undefined;
  const formMessage = error && !error.field ? (t.has(`errors.${error.code}`) ? t(`errors.${error.code}`) : t("errors.unknown")) : undefined;

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-6" noValidate>
      {formMessage && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {formMessage}
        </p>
      )}
      {state?.status === "saved" && (
        <p role="status" className="rounded-md border bg-muted px-4 py-3 text-sm font-medium">
          {t("saved")}
        </p>
      )}

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium">{t("role")}</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {ACCOUNT_ROLES.map((role) => (
            <label
              key={role}
              className="flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:border-foreground has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-background has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2"
            >
              <input type="radio" name="role" value={role} defaultChecked={initial.role === role} disabled={isSelf && initial.role !== role} className="sr-only" />
              {t(`roles.${role}`)}
            </label>
          ))}
        </div>
        <p className={message("role") ? "text-sm text-destructive" : "text-xs text-muted-foreground"}>
          {message("role") ?? (isSelf ? t("roleSelf") : t("roleHelp"))}
        </p>
      </fieldset>

      <NumberField id={`${id}-credits`} name="credits" label={t("credits")} help={t("creditsHelp")} max={MAX_CREDITS} value={initial.credits} error={message("credits")} />
      <NumberField id={`${id}-points`} name="points" label={t("points")} help={t("pointsHelp")} max={MAX_POINTS} value={initial.points} error={message("points")} />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? t("saving") : t("save")}
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/admin/users">{t("back")}</Link>
        </Button>
      </div>
    </form>
  );
}

function NumberField({ id, name, label, help, max, value, error }: { id: string; name: string; label: string; help: string; max: number; value: number; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input id={id} name={name} type="number" inputMode="numeric" min={0} max={max} step={1} defaultValue={value} aria-invalid={Boolean(error)} aria-describedby={`${id}-help`} className="max-w-48 tabular-nums" />
      <p id={`${id}-help`} className={error ? "text-sm text-destructive" : "text-xs text-muted-foreground"}>
        {error ?? help}
      </p>
    </div>
  );
}
