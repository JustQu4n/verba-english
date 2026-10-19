import { MAX_WORD_LENGTH, type DictionaryEntry, type DictionaryMeaning } from "../domain/dictionary-entry";

const MAX_MEANINGS = 5;

type Json = Record<string, unknown>;
const isObject = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

function toMeaning(value: unknown): DictionaryMeaning | null {
  if (!isObject(value)) return null;
  const definition = text(value.definition);
  if (!definition) return null;
  return {
    definition,
    pos: text(value.pos),
    example: text(value.example),
    vietnamese: value.definition_lang === "vi",
  };
}

/** The bracketed form /.../ reads best; fall back to the first one that has any text. */
function pickIpa(value: unknown): string | null {
  const list = Array.isArray(value) ? value.filter(isObject) : [];
  const ipas = list.map((p) => ({ ipa: text(p.ipa), region: text(p.region) })).filter((p): p is { ipa: string; region: string | null } => p.ipa !== null);
  const slashed = ipas.find((p) => p.region === null && p.ipa.startsWith("/")) ?? ipas.find((p) => p.ipa.startsWith("/"));
  return (slashed ?? ipas[0])?.ipa ?? null;
}

function absolute(path: string | null, baseUrl: string): string | null {
  if (!path) return null;
  try {
    return new URL(path, baseUrl).toString();
  } catch {
    return null;
  }
}

/**
 * Turns the dictionary service response into an entry. Tolerant on purpose: a missing or odd field drops that
 * field, not the whole word. Returns null when the word does not exist or has no usable meaning.
 */
export function parseLookupResponse(body: unknown, baseUrl: string): DictionaryEntry | null {
  if (!isObject(body) || body.exists === false) return null;
  const results = Array.isArray(body.results) ? body.results.filter(isObject) : [];
  const result = results.find((r) => r.lang_code === "en") ?? results[0];
  if (!result) return null;

  const meanings = (Array.isArray(result.meanings) ? result.meanings : [])
    .map(toMeaning)
    .filter((m): m is DictionaryMeaning => m !== null);
  if (meanings.length === 0) return null;
  // Vietnamese first; the sort is stable so the service's own order is kept inside each group.
  const ordered = [...meanings].sort((a, b) => Number(b.vietnamese) - Number(a.vietnamese)).slice(0, MAX_MEANINGS);

  const word = (text(body.word) ?? "").slice(0, MAX_WORD_LENGTH);
  if (!word) return null;
  return { word, ipa: pickIpa(result.pronunciations), audioUrl: absolute(text(result.audio), baseUrl), meanings: ordered, source: "dictionary" };
}
