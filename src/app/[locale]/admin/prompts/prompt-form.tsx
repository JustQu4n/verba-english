"use client";

import { Plus, Sparkles, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useId, useState, useTransition } from "react";

import { Field } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Link } from "@/i18n/navigation";
import { suggestAnswersAction } from "./actions";
import { KeywordInput } from "./keyword-input";
import type { AnswerFormValues, PromptFormState, PromptFormValues } from "@/lib/prompt-form";
import { cn } from "@/lib/utils";
import { answerKey, MAX_ACCEPTED_ANSWERS, MAX_ANSWER_TEXT_LENGTH, MAX_STRUCTURE_LENGTH } from "@/modules/writing/domain/accepted-answer";
import { mergeKeywords, parseKeywords, joinKeywords } from "@/modules/writing/domain/keywords";
import { MAX_HINT_LENGTH, MAX_VIETNAMESE_LENGTH } from "@/modules/writing/domain/prompt";
import { CATEGORIES, LEVELS } from "@/modules/writing/domain/sentence-catalog";

export const EMPTY_PROMPT: PromptFormValues = { level: "beginner", category: "", vietnamese: "", hint: "", published: false, answers: [] };

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
  const fieldError = (field: "level" | "category" | "vietnamese" | "hint" | "answers") => {
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
            <KeywordInput
              id={props.id}
              value={values.hint}
              onChange={(hint) => set("hint", hint)}
              invalid={props["aria-invalid"]}
              describedBy={props["aria-describedby"]}
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

      <AnswersEditor
        answers={values.answers}
        onChange={(answers) => set("answers", answers)}
        sentence={{ vietnamese: values.vietnamese, level: values.level, hint: values.hint }}
        onKeywords={(keywords) => set("hint", joinKeywords(mergeKeywords(parseKeywords(values.hint), keywords)))}
        error={fieldError("answers")}
      />

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

const EMPTY_ANSWER: AnswerFormValues = { text: "", structureVi: "", structureEn: "" };
const textareaClass =
  "w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

interface AnswersEditorProps {
  answers: AnswerFormValues[];
  onChange: (answers: AnswerFormValues[]) => void;
  sentence: { vietnamese: string; level: string; hint: string };
  /** Key words the AI drafted; the form adds them to the hint. */
  onKeywords: (keywords: string[]) => void;
  error?: string;
}

/**
 * Accepted answers with grammar notes. A learner whose answer equals one of them is graded right away, without the AI.
 * "AI suggestions" fills answer rows and key words to review: nothing is saved until the form is.
 */
function AnswersEditor({ answers, onChange, sentence, onKeywords, error }: AnswersEditorProps) {
  const t = useTranslations("Admin.form.answers");
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const full = answers.length >= MAX_ACCEPTED_ANSWERS;
  const update = (index: number, patch: Partial<AnswerFormValues>) =>
    onChange(answers.map((answer, i) => (i === index ? { ...answer, ...patch } : answer)));

  function suggest() {
    setNotice(null);
    startTransition(async () => {
      const result = await suggestAnswersAction(sentence);
      if (result.status === "error") return setNotice(t(`suggestErrors.${result.reason}`));
      const known = new Set(answers.map((answer) => answerKey(answer.text)));
      const fresh = result.answers.filter((answer) => !known.has(answerKey(answer.text)));
      const merged = [...answers, ...fresh].slice(0, MAX_ACCEPTED_ANSWERS);
      onChange(merged);
      onKeywords(result.keywords);
      setNotice(t("suggested", { count: merged.length - answers.length, keywords: result.keywords.length }));
    });
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium">{t("title")}</legend>
      <p className="text-xs text-muted-foreground">{t("help")}</p>

      {answers.map((answer, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-lg border p-4">
          <div className="flex items-start gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <label htmlFor={`answer-${index}`} className="text-sm font-medium">
                {t("answer", { number: index + 1 })}
              </label>
              <Input
                id={`answer-${index}`}
                name="answerText"
                lang="en"
                value={answer.text}
                maxLength={MAX_ANSWER_TEXT_LENGTH + 50}
                onChange={(event) => update(index, { text: event.target.value })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-6"
              aria-label={t("remove", { number: index + 1 })}
              onClick={() => onChange(answers.filter((_, i) => i !== index))}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`structure-vi-${index}`} className="text-sm text-muted-foreground">
                {t("structureVi")}
              </label>
              <textarea
                id={`structure-vi-${index}`}
                name="answerStructureVi"
                lang="vi"
                rows={3}
                value={answer.structureVi}
                maxLength={MAX_STRUCTURE_LENGTH + 50}
                onChange={(event) => update(index, { structureVi: event.target.value })}
                className={textareaClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`structure-en-${index}`} className="text-sm text-muted-foreground">
                {t("structureEn")}
              </label>
              <textarea
                id={`structure-en-${index}`}
                name="answerStructureEn"
                lang="en"
                rows={3}
                value={answer.structureEn}
                maxLength={MAX_STRUCTURE_LENGTH + 50}
                onChange={(event) => update(index, { structureEn: event.target.value })}
                className={textareaClass}
              />
            </div>
          </div>
        </div>
      ))}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" disabled={full} onClick={() => onChange([...answers, EMPTY_ANSWER])}>
          <Plus aria-hidden="true" />
          {t("add")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending || sentence.vietnamese.trim() === ""}
          onClick={suggest}
        >
          <Sparkles aria-hidden="true" />
          {pending ? t("suggesting") : t("suggest")}
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">
          {answers.length}/{MAX_ACCEPTED_ANSWERS}
        </span>
      </div>
      {notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      )}
    </fieldset>
  );
}
