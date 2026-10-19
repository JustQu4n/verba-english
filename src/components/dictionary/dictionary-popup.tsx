"use client";

import { BookmarkCheck, BookmarkPlus, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";

import { lookup, setSaved, toLookupWord, type LookupOutcome } from "./dictionary-client";
import { EntryContent, PronounceButton } from "./entry-content";

/** Only text inside an element with this attribute opens the popup (the answer box, the AI suggestion). */
export const DICTIONARY_ATTR = "data-dictionary";

interface Anchor {
  word: string;
  x: number;
  y: number;
}

type View = { status: "loading" } | LookupOutcome;
interface Fetched {
  word: string;
  attempt: number;
  outcome: LookupOutcome;
}

const WIDTH = 352;
const MARGIN = 12;
const SETTLE_MS = 250;

/** Reads the selected text and where it is, but only when it sits inside a marked area. */
function readSelection(lastPointer: { x: number; y: number } | null): Anchor | null {
  const active = document.activeElement;
  let text = "";
  let rect: DOMRect | null = null;
  if ((active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement) && active.closest(`[${DICTIONARY_ATTR}]`)) {
    text = active.value.slice(active.selectionStart ?? 0, active.selectionEnd ?? 0);
    const box = active.getBoundingClientRect();
    // A field has no rectangle for its selection: use the pointer when it is inside, else the bottom-left of the field.
    const inside = lastPointer && lastPointer.x >= box.left && lastPointer.x <= box.right && lastPointer.y >= box.top && lastPointer.y <= box.bottom;
    rect = inside ? new DOMRect(lastPointer.x, lastPointer.y, 0, 0) : new DOMRect(box.left + 16, box.bottom - 8, 0, 0);
  } else {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
    const node = selection.anchorNode;
    const element = node instanceof Element ? node : node?.parentElement;
    if (!element?.closest(`[${DICTIONARY_ATTR}]`)) return null;
    text = selection.toString();
    rect = selection.getRangeAt(0).getBoundingClientRect();
  }
  const word = toLookupWord(text);
  if (!word || !rect) return null;
  return { word, x: rect.left, y: rect.bottom };
}

/**
 * Looks a word up when the learner selects it. Mount it once on a page; mark the text that may be looked up with
 * `data-dictionary`. Listens to the document, so it works for the answer box and for the AI feedback alike.
 */
export function DictionaryPopup() {
  const t = useTranslations("Dictionary");
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [fetched, setFetched] = useState<Fetched | null>(null);
  const [saved, setSavedState] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failedWord, setFailedWord] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const dismissed = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const word = anchor?.word ?? null;

  const close = useCallback(() => {
    setAnchor(null);
  }, []);

  // Open, move or close the popup after the selection settles (touch selection handles keep changing it).
  useEffect(() => {
    function evaluate() {
      if (popupRef.current?.contains(document.activeElement)) return;
      const next = readSelection(pointer.current);
      if (!next) {
        dismissed.current = null;
        setAnchor(null);
        return;
      }
      if (dismissed.current === next.word) return;
      dismissed.current = null;
      setAnchor((current) => (current?.word === next.word ? current : next));
    }
    const schedule = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(evaluate, SETTLE_MS);
    };
    const track = (event: MouseEvent | TouchEvent) => {
      const point = "changedTouches" in event ? event.changedTouches[0] : event;
      if (point) pointer.current = { x: point.clientX, y: point.clientY };
      schedule();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setAnchor((current) => {
        if (current) dismissed.current = current.word;
        return null;
      });
    };
    document.addEventListener("selectionchange", schedule);
    document.addEventListener("mouseup", track);
    document.addEventListener("touchend", track);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", close);
    return () => {
      clearTimeout(timer.current);
      document.removeEventListener("selectionchange", schedule);
      document.removeEventListener("mouseup", track);
      document.removeEventListener("touchend", track);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", close);
    };
  }, [close]);

  // Fetch the word; a newer selection cancels the older request.
  useEffect(() => {
    if (!word) return;
    const controller = new AbortController();
    lookup(word, controller.signal)
      .then((outcome) => {
        setFetched({ word, attempt: retry, outcome });
        if (outcome.status === "ok") setSavedState(outcome.data.saved);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [word, retry]);

  async function toggleSaved() {
    if (!word || saving) return;
    setSaving(true);
    setFailedWord(null);
    const result = await setSaved(word, !saved);
    setSaving(false);
    if (result === "ok") setSavedState(!saved);
    else setFailedWord(word);
  }

  if (!anchor || typeof document === "undefined") return null;
  // Until the answer for THIS word (and this attempt) arrives, show the loading state.
  const view: View = fetched && fetched.word === anchor.word && fetched.attempt === retry ? fetched.outcome : { status: "loading" };
  const saveFailed = failedWord === anchor.word;

  const width = Math.min(WIDTH, window.innerWidth - MARGIN * 2);
  const left = Math.max(MARGIN, Math.min(anchor.x - 16, window.innerWidth - width - MARGIN));
  const below = anchor.y < window.innerHeight * 0.55;
  const style = below ? { left, width, top: anchor.y + 22 } : { left, width, bottom: window.innerHeight - anchor.y + 36 };

  return createPortal(
    <div
      ref={popupRef}
      role="dialog"
      aria-label={t("popupLabel", { word: anchor.word })}
      style={style}
      // The popup is not part of the page text: clicks inside must not change the selection or re-run the lookup.
      onMouseUp={(event) => event.stopPropagation()}
      onTouchEnd={(event) => event.stopPropagation()}
      className="fixed z-50 max-h-[70vh] overflow-y-auto rounded-2xl border bg-background p-4 text-foreground shadow-xl"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1" aria-live="polite">
          {view.status === "loading" && (
            <p className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
              <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />
              <span lang="en" className="font-semibold text-foreground">{anchor.word}</span>
              {t("lookingUp")}
            </p>
          )}
          {view.status === "ok" && view.data.entry && <EntryContent entry={view.data.entry} />}
          {view.status === "ok" && !view.data.entry && (
            <div className="py-1 text-sm/relaxed">
              <p lang="en" className="text-lg font-bold tracking-tight break-words">{anchor.word}</p>
              <p className="mt-1">{t("notFound", { word: anchor.word })}</p>
              <p className="mt-1 text-muted-foreground">{t("notFoundHint")}</p>
            </div>
          )}
          {view.status === "error" && (
            <div className="py-1 text-sm">
              <p role="alert">{t(view.reason)}</p>
              {view.reason === "unavailable" && (
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setRetry((n) => n + 1)}>
                  {t("retry")}
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center">
          {view.status === "ok" && view.data.entry && <PronounceButton entry={view.data.entry} />}
          <button
            type="button"
            onClick={() => {
              dismissed.current = anchor.word;
              close();
            }}
            aria-label={t("close")}
            className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {view.status === "ok" && (
        <div className="mt-4 border-t pt-3">
          <Button type="button" variant={saved ? "default" : "outline"} size="sm" onClick={toggleSaved} disabled={saving} aria-pressed={saved}>
            {saving ? <Loader2 className="motion-safe:animate-spin" aria-hidden="true" /> : saved ? <BookmarkCheck aria-hidden="true" /> : <BookmarkPlus aria-hidden="true" />}
            {saving ? t("saving") : saved ? t("saved") : t("save")}
          </Button>
          {saveFailed && (
            <p role="alert" className="mt-2 text-xs font-medium text-destructive">
              {t("saveError")}
            </p>
          )}
        </div>
      )}
    </div>,
    document.body
  );
}
