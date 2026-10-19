"use client";

import { ChevronDown, Loader2, Sparkles, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { useCredits } from "@/components/dashboard/credits-context";
import { setSaved, translate, type TranslateOutcome } from "@/components/dictionary/dictionary-client";
import { EntryContent, PronounceButton } from "@/components/dictionary/entry-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { TRANSLATE_COST } from "@/modules/credits/domain/credits";
import { cleanWord, type DictionaryEntry } from "@/modules/dictionary/domain/dictionary-entry";

type TranslateError = Extract<TranslateOutcome, { status: "error" }>["reason"];

/** Saved words, newest first, with a form to add a word and let the AI write its meaning. */
export function SavedWordList({ initial }: { initial: DictionaryEntry[] }) {
  const t = useTranslations("Vocabulary");
  const { setCredits } = useCredits();
  const [words, setWords] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  // Cards start collapsed: just the word. The learner opens the ones they want to read.
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const [draft, setDraft] = useState("");
  // The word being translated, whether typed in the form or chosen on a card.
  const [translating, setTranslating] = useState<string | null>(null);
  const [error, setError] = useState<{ word: string; reason: TranslateError } | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  function toggle(word: string) {
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(word)) next.add(word);
      return next;
    });
  }

  async function remove(word: string) {
    setBusy(word);
    setFailed(false);
    const result = await setSaved(word, false);
    setBusy(null);
    if (result === "ok") setWords((list) => list.filter((entry) => entry.word !== word));
    else setFailed(true);
  }

  /** One credit: the AI writes the meaning, the server saves the word, the new balance comes back. */
  async function translateWord(text: string, fromForm: boolean) {
    const word = cleanWord(text);
    if (!word) {
      setError({ word: text, reason: "invalid_word" });
      return;
    }
    setTranslating(word);
    setError(null);
    setAdded(null);
    const result = await translate(word);
    setTranslating(null);
    if (result.status === "error") {
      setError({ word, reason: result.reason });
      return;
    }
    setCredits(result.credits);
    setWords((list) => [result.entry, ...list.filter((entry) => entry.word !== word)]);
    setOpen((current) => new Set(current).add(word));
    setAdded(word);
    if (fromForm) setDraft("");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (draft.trim() && !translating) void translateWord(draft, true);
  }

  const cost = t("cost", { count: TRANSLATE_COST });

  return (
    <>
      <form onSubmit={onSubmit} className="mt-8 rounded-2xl border p-4 sm:p-5">
        <label htmlFor="new-word" className="text-sm font-semibold">
          {t("addLabel")}
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            id="new-word"
            lang="en"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={60}
            placeholder={t("addPlaceholder")}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-describedby="new-word-help"
            className="sm:flex-1"
          />
          <Button type="submit" disabled={!draft.trim() || translating !== null} className="shrink-0">
            {translating !== null && translating === cleanWord(draft) ? <Loader2 className="motion-safe:animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
            {translating !== null && translating === cleanWord(draft) ? t("translating") : t("translate")}
          </Button>
        </div>
        <p id="new-word-help" className="mt-2 text-xs text-muted-foreground">
          {t("addHelp", { cost })}
        </p>
        {error && (
          <p role="alert" className="mt-2 text-sm font-medium text-destructive">
            {t(`translateErrors.${error.reason}`)}
          </p>
        )}
        {added && !error && (
          <p role="status" className="mt-2 text-sm font-medium">
            {t("added", { word: added })}
          </p>
        )}
      </form>

      {words.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed px-6 py-14 text-center">
          <p className="text-lg font-semibold tracking-tight">{t("empty")}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{t("emptyBody")}</p>
          <Button asChild className="mt-6 rounded-full">
            <Link href="/dashboard/writing/sentence">{t("startPractice")}</Link>
          </Button>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm font-medium text-muted-foreground">{t("count", { count: words.length })}</p>
          {failed && (
            <p role="alert" className="mt-3 text-sm font-medium text-destructive">
              {t("removeError")}
            </p>
          )}
          <ul className="mt-3 flex flex-col gap-3">
            {words.map((entry) => {
              const hasMeaning = entry.meanings.length > 0;
              const expanded = open.has(entry.word);
              return (
                <li key={entry.word} className="flex items-start gap-2 rounded-2xl border p-4 sm:p-5">
                  <div className="min-w-0 flex-1">
                    <EntryContent entry={entry} collapsed={!expanded} />
                    {hasMeaning ? (
                      <button
                        type="button"
                        onClick={() => toggle(entry.word)}
                        aria-expanded={expanded}
                        className="mt-2 inline-flex items-center gap-1 rounded-md text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        {expanded ? t("showLess") : t("showMore")}
                        <ChevronDown className={expanded ? "size-4 rotate-180" : "size-4"} aria-hidden="true" />
                      </button>
                    ) : (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">{t("noMeaning")}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          disabled={translating !== null}
                          onClick={() => void translateWord(entry.word, false)}
                        >
                          {translating === entry.word ? <Loader2 className="motion-safe:animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                          {translating === entry.word ? t("translating") : `${t("translate")} · ${cost}`}
                        </Button>
                        {error?.word === entry.word && (
                          <p role="alert" className="mt-2 text-sm font-medium text-destructive">
                            {t(`translateErrors.${error.reason}`)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <PronounceButton entry={entry} />
                  <button
                    type="button"
                    onClick={() => remove(entry.word)}
                    disabled={busy === entry.word}
                    aria-label={t("remove", { word: entry.word })}
                    className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
