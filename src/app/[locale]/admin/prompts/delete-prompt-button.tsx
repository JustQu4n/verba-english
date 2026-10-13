"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

import { Button } from "@/components/ui/button";

/** Delete with a confirmation dialog (native <dialog>: focus trap, Esc to close). `action` is a Server Action bound to the id. */
export function DeletePromptButton({ text, action }: { text: string; action: () => Promise<void> }) {
  const t = useTranslations("Admin.prompts.delete");
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => dialog.current?.showModal()}>
        <Trash2 aria-hidden="true" />
        {t("open")}
        <span className="sr-only">: {text}</span>
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby="delete-title"
        className="m-auto w-[calc(100%-2rem)] text-left max-w-md rounded-2xl border bg-background p-6 text-foreground shadow-xl backdrop:bg-black/50"
      >
        <h2 id="delete-title" className="text-lg font-semibold tracking-tight">
          {t("title")}
        </h2>
        <p className="mt-2 text-sm/relaxed text-muted-foreground">{t("body")}</p>
        <blockquote className="mt-3 rounded-lg bg-muted px-4 py-3 text-sm" lang="vi">
          {text}
        </blockquote>
        <form action={action} className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => dialog.current?.close()}>
            {t("cancel")}
          </Button>
          <Button type="submit">{t("confirm")}</Button>
        </form>
      </dialog>
    </>
  );
}
