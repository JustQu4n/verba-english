"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ClipboardEvent, type KeyboardEvent, useRef, useState } from "react";

import { joinKeywords, mergeKeywords, parseKeywords } from "@/modules/writing/domain/keywords";
import { cn } from "@/lib/utils";

interface KeywordInputProps {
  id: string;
  /** The stored hint: key words joined by commas. */
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
}

/**
 * Key words as chips. Enter or a comma ends a word, Backspace on an empty box removes the last one,
 * and pasted text is split on commas. The form still receives one plain `hint` field (comma separated),
 * including a word that was typed but not yet confirmed, so saving never loses it.
 */
export function KeywordInput({ id, value, onChange, invalid, describedBy }: KeywordInputProps) {
  const t = useTranslations("Admin.form");
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const words = parseKeywords(value);

  const commit = (text: string) => {
    const added = parseKeywords(text);
    if (added.length > 0) onChange(joinKeywords(mergeKeywords(words, added, Infinity)));
    setDraft("");
  };
  const remove = (index: number) => {
    onChange(joinKeywords(words.filter((_, i) => i !== index)));
    inputRef.current?.focus();
  };

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      // Enter would otherwise submit the whole form.
      event.preventDefault();
      commit(draft);
    } else if (event.key === "Backspace" && draft === "" && words.length > 0) {
      onChange(joinKeywords(words.slice(0, -1)));
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData("text");
    if (!/[,\n;]/.test(text)) return;
    event.preventDefault();
    commit(`${draft}${text}`);
  }

  // What the form submits: confirmed words plus the one still being typed.
  const submitted = joinKeywords(mergeKeywords(words, parseKeywords(draft), Infinity));

  return (
    <div
      className={cn(
        "flex min-h-9 w-full cursor-text flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 shadow-xs focus-within:ring-[3px] focus-within:ring-ring/50",
        invalid && "border-destructive"
      )}
      onClick={() => inputRef.current?.focus()}
    >
      <input type="hidden" name="hint" value={submitted} />
      {words.map((word, index) => (
        <span key={word} className="inline-flex items-center gap-1 rounded-full bg-solid py-0.5 pl-2.5 pr-1 text-sm text-on-solid">
          <span lang="en">{word}</span>
          <button
            type="button"
            aria-label={t("removeKeyword", { word })}
            onClick={(event) => {
              event.stopPropagation();
              remove(index);
            }}
            className="inline-flex size-5 items-center justify-center rounded-full hover:bg-on-solid/20 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-background"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        id={id}
        lang="en"
        autoComplete="off"
        value={draft}
        placeholder={words.length === 0 ? t("keywordPlaceholder") : ""}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onBlur={() => commit(draft)}
        className="min-w-24 flex-1 bg-transparent px-1 py-0.5 text-base outline-none md:text-sm"
      />
    </div>
  );
}
