"use client";

import { Camera, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { resizeToSquare } from "@/lib/image-resize";
import { isDefaultAvatar } from "@/modules/profile/domain/avatar";

import { removeAvatarAction, uploadAvatarAction } from "./actions";

const ACCEPT = "image/jpeg,image/png,image/webp";

interface AvatarEditorProps {
  initials: string;
  /** The saved picture (https only), or null to show the initials. */
  avatarUrl: string | null;
}

/** The profile picture with "Change photo" and "Remove". The picture is shrunk in the browser, then sent to the server. */
export function AvatarEditor({ initials, avatarUrl }: AvatarEditorProps) {
  const t = useTranslations("ProfilePage.avatar");
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  // What is shown now: starts as the saved picture and follows what the server answers.
  const [picture, setPicture] = useState(avatarUrl);
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  const customPicture = picture !== null && !isDefaultAvatar(picture);
  const fail = (code: string) => setMessage({ kind: "error", text: t.has(`errors.${code}`) ? t(`errors.${code}`) : t("errors.unknown") });

  function onFile(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    startTransition(async () => {
      let image: Blob;
      try {
        image = await resizeToSquare(file);
      } catch {
        return fail("unreadable");
      }
      const form = new FormData();
      form.set("avatar", image, "avatar");
      const result = await uploadAvatarAction(form);
      if (result.status === "error") return fail(result.code);
      setPicture(result.avatarUrl ?? null);
      setMessage({ kind: "ok", text: t("saved") });
    });
  }

  function onRemove() {
    setMessage(null);
    startTransition(async () => {
      const result = await removeAvatarAction();
      if (result.status === "error") return fail(result.code);
      setPicture(result.avatarUrl ?? null);
      setMessage({ kind: "ok", text: t("removedDone") });
    });
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:w-44 sm:shrink-0 sm:items-start">
      <div className="relative">
        <Avatar className="size-24 ring-2 ring-inverse-foreground/30 sm:size-28">
          {picture ? <AvatarImage src={picture} alt="" /> : null}
          <AvatarFallback className="bg-inverse-foreground text-3xl font-bold text-inverse">{initials}</AvatarFallback>
        </Avatar>
        {pending && (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-black/55 text-white" role="status">
            <Loader2 className="size-6 animate-spin" aria-hidden="true" />
            <span className="sr-only">{t("uploading")}</span>
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-label={t("choose")}
        onChange={(event) => {
          onFile(event.target.files?.[0]);
          // The same file can be chosen again after an error.
          event.target.value = "";
        }}
      />
      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
        <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => inputRef.current?.click()} className="rounded-full">
          <Camera aria-hidden="true" />
          {t("change")}
        </Button>
        {customPicture && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={onRemove}
            className="rounded-full text-inverse-foreground hover:bg-inverse-foreground/10 hover:text-inverse-foreground"
          >
            <Trash2 aria-hidden="true" />
            {t("remove")}
          </Button>
        )}
      </div>
      <p className="text-xs text-inverse-foreground/60">{t("hint")}</p>
      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className="rounded-md bg-inverse-foreground px-2.5 py-1 text-xs font-medium text-inverse">
          {message.text}
        </p>
      )}
    </div>
  );
}
