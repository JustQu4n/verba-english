"use client";

import { useTranslations } from "next-intl";
import { useActionState, useId, useState } from "react";

import { Field } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Link } from "@/i18n/navigation";
import type { PromptFormState, PromptFormValues } from "@/lib/prompt-form";
import { cn } from "@/lib/utils";
import { MAX_HINT_LENGTH, MAX_VIETNAMESE_LENGTH } from "@/modules/writing/domain/prompt";
import { CATEGORIES, LEVELS } from "@/modules/writing/domain/sentence-catalog";

export const EMPTY_PROMPT: PromptFormValues = { level: "beginner", category: "", vietnamese: "", hint: "", published: false };

interface PromptFormProps {
  action: (state: PromptFormState, formData: FormData) => Promise<PromptFormState>;
  initial?: PromptFormValues;
  mode: "create" | "edit";
}

function Counter({ value, max, id }: { value: string; max: number; id: string }) {
  const t = useTranslations("Admin.form");
  const length = value.trim().length;
  return (
    <span id={id} className={cn("text-xs tabular-nums", length > max ? "text-destructive" : "text-muted-foreground")}>
      {t("count", { count: length, max })}
    </span>
  );
}

/** Create / edit form. Values live in state so a failed save keeps everything the admin typed. */
export function PromptForm({ action, initial = EMPTY_PROMPT, mode }: PromptFormProps) {
  const t = useTranslations("Admin.form");
  const tSentence = useTranslations("Sentence");
  const id = useId();
  const [state, formAction, pending] = useActionState<PromptFormState, FormData>(action, undefined);
  const [values, setValues] = useState(initial);
  const set = <K extends keyof PromptFormValues>(key: K, value: PromptFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const errors = state?.status === "error" ? state.errors : undefined;
  const fieldError = (field: "level" | "category" | "vietnamese" | "hint") => {
    const code = errors?.fieldErrors?.[field];
    return code ? t(`errors.${code}`) : undefined;
  };

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6" noValidate>
      {errors?.formError && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {t(`formErrors.${errors.formError}`)}
        </p>
      )}

      <Field id={`${id}-vietnamese`} label={t("vietnamese")} hint={t("vietnameseHelp")} error={fieldError("vietnamese")}>
        {(props) => (
          <>
            <textarea
              {...props}
              name="vietnamese"
              lang="vi"
              rows={3}
              value={values.vietnamese}
              onChange={(event) => set("vietnamese", event.target.value)}
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-base shadow-xs outline-none aria-invalid:border-destructive focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
            />
            <Counter id={`${id}-vietnamese-count`} value={values.vietnamese} max={MAX_VIETNAMESE_LENGTH} />
          </>
        )}
      </Field>

      <Field id={`${id}-hint`} label={t("hint")} hint={t("hintHelp")} error={fieldError("hint")}>
        {(props) => (
          <>
            <Input
              {...props}
              name="hint"
              lang="en"
              value={values.hint}
              onChange={(event) => set("hint", event.target.value)}
            />
            <Counter id={`${id}-hint-count`} value={values.hint} max={MAX_HINT_LENGTH} />
          </>
        )}
      </Field>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium">{t("level")}</legend>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          {LEVELS.map((level) => (
            <label
              key={level}
              className="flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:border-foreground has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-background has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2"
            >
              <input
                type="radio"
                name="level"
                value={level}
                checked={values.level === level}
                onChange={() => set("level", level)}
                className="sr-only"
              />
              {tSentence(`levels.${level}.name`)}
            </label>
          ))}
        </div>
        {fieldError("level") && <p className="text-sm text-destructive">{fieldError("level")}</p>}
      </fieldset>

      <Field id={`${id}-category`} label={t("category")} error={fieldError("category")}>
        {(props) => (
          <NativeSelect
            {...props}
            name="category"
            value={values.category}
            onChange={(event) => set("category", event.target.value)}
          >
            <option value="" disabled>
              {t("categoryPlaceholder")}
            </option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {tSentence(`categories.${category}`)}
              </option>
            ))}
          </NativeSelect>
        )}
      </Field>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
        <input
          type="checkbox"
          name="published"
          checked={values.published}
          onChange={(event) => set("published", event.target.checked)}
          className="mt-0.5 size-4 accent-foreground"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{t("publish")}</span>
          <span className="text-xs text-muted-foreground">{t("publishHelp")}</span>
        </span>
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? t("saving") : mode === "create" ? t("create") : t("save")}
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/admin/prompts">{t("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
