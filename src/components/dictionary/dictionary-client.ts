import type { DictionaryEntry } from "@/modules/dictionary/domain/dictionary-entry";

/** `entry` is null when the dictionary has no such word; the word can still be saved. */
export type LookupData = { entry: DictionaryEntry | null; saved: boolean };
export type LookupOutcome = { status: "ok"; data: LookupData } | { status: "error"; reason: "unauthorized" | "unavailable" };
export type ChangeOutcome = "ok" | "unauthorized" | "unavailable";
export type TranslateOutcome =
  | { status: "ok"; entry: DictionaryEntry; credits: number }
  | { status: "error"; reason: "unauthorized" | "no_credits" | "cannot_translate" | "invalid_word" | "unavailable" };

/** Only English words are looked up: Vietnamese text in the feedback must not open the popup. */
const ENGLISH_WORD = /^[a-z][a-z' -]*$/;

/** The lookup key for a selected text, or null when it is not an English word or short phrase. */
export function toLookupWord(selected: string): string | null {
  const word = selected
    .replace(/[‘’]/g, "'")
    .replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
  return word.length > 0 && word.length <= 60 && ENGLISH_WORD.test(word) ? word : null;
}

// Answers already seen in this visit: selecting the same word twice does not call the server again.
const seen = new Map<string, LookupData>();

function reasonOf(status: number): "unauthorized" | "unavailable" {
  return status === 401 ? "unauthorized" : "unavailable";
}

export async function lookup(word: string, signal: AbortSignal): Promise<LookupOutcome> {
  const known = seen.get(word);
  if (known) return { status: "ok", data: known };
  try {
    const response = await fetch(`/api/dictionary?word=${encodeURIComponent(word)}`, { signal });
    if (!response.ok) return { status: "error", reason: reasonOf(response.status) };
    const data = (await response.json()) as LookupData;
    const result: LookupData = { entry: data.entry, saved: data.saved };
    seen.set(word, result);
    return { status: "ok", data: result };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return { status: "error", reason: "unavailable" };
  }
}

/** Saves or removes a word on the server and keeps the local answer in step. */
export async function setSaved(word: string, saved: boolean): Promise<ChangeOutcome> {
  try {
    const response = saved
      ? await fetch("/api/dictionary/saved", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ word }) })
      : await fetch(`/api/dictionary/saved?word=${encodeURIComponent(word)}`, { method: "DELETE" });
    if (!response.ok) return reasonOf(response.status);
    const known = seen.get(word);
    if (known) seen.set(word, { ...known, saved });
    return "ok";
  } catch {
    return "unavailable";
  }
}

/** The AI writes the meaning, the word is saved and one credit is spent. */
export async function translate(word: string): Promise<TranslateOutcome> {
  try {
    const response = await fetch("/api/dictionary/translate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ word }) });
    if (response.ok) {
      const data = (await response.json()) as { entry: DictionaryEntry; credits: number };
      // What the popup remembers for this word is now out of date.
      seen.delete(word);
      return { status: "ok", entry: data.entry, credits: data.credits };
    }
    const reason = { 400: "invalid_word", 401: "unauthorized", 402: "no_credits", 404: "cannot_translate" }[response.status];
    return { status: "error", reason: (reason ?? "unavailable") as Extract<TranslateOutcome, { status: "error" }>["reason"] };
  } catch {
    return { status: "error", reason: "unavailable" };
  }
}

export function playAudio(url: string) {
  // A blocked or failed playback is not worth a message: the learner can press the button again.
  new Audio(url).play().catch(() => {});
}
