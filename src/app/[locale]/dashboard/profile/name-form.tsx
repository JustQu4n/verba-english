"use client";

import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_NAME_LENGTH } from "@/modules/profile/domain/avatar";

import { updateNameAction } from "./actions";

/** Edits the display name. Shown on the leaderboard and in the menu. */
export function NameForm({ initialName }: { initialName: string }) {
  const t = useTranslations("ProfilePage.name");
  const id = useId();
  const [name, setName] = useState(initialName);
  const [saved, setSaved] = useState(initialName);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const changed = name.trim() !== saved.trim();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await updateNameAction(name);
      if (result.status === "error") {
        setMessage({ kind: "error", text: t.has(`errors.${result.code}`) ? t(`errors.${result.code}`) : t("errors.unknown") });
        return;
      }
      const next = result.fullName ?? name.trim();
      setName(next);
      setSaved(next);
      setMessage({ kind: "ok", text: t("saved") });
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2" noValidate>
      <label htmlFor={id} className="text-sm font-medium">
        {t("label")}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={id}
          value={name}
          maxLength={MAX_NAME_LENGTH + 20}
          autoComplete="name"
          aria-invalid={message?.kind === "error"}
          aria-describedby={message ? `${id}-message` : undefined}
          onChange={(event) => {
            setName(event.target.value);
            setMessage(null);
          }}
          className="sm:max-w-sm"
        />
        <Button type="submit" disabled={pending || !changed} className="rounded-full">
          {pending ? t("saving") : t("save")}
        </Button>
      </div>
      {message && (
        <p id={`${id}-message`} role={message.kind === "error" ? "alert" : "status"} className={message.kind === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {message.text}
        </p>
      )}
    </form>
  );
}
