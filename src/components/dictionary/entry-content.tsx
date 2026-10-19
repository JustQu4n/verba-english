"use client";

import { Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";

import type { DictionaryEntry } from "@/modules/dictionary/domain/dictionary-entry";

import { playAudio } from "./dictionary-client";

export function PronounceButton({ entry }: { entry: DictionaryEntry }) {
  const t = useTranslations("Dictionary");
  if (!entry.audioUrl) return null;
  const url = entry.audioUrl;
  return (
    <button
      type="button"
      onClick={() => playAudio(url)}
      // Keeps the selected text selected, so the popup stays open.
      onMouseDown={(event) => event.preventDefault()}
      aria-label={t("listen", { word: entry.word })}
      className="grid size-9 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <Volume2 className="size-5" aria-hidden="true" />
    </button>
  );
}

/** Word, phonetics, Vietnamese meanings and one example. Shared by the popup and the saved list. */
export function EntryContent({ entry, showWord = true, collapsed = false }: { entry: DictionaryEntry; showWord?: boolean; /** Word and phonetics only; the meanings are hidden. */ collapsed?: boolean }) {
  const t = useTranslations("Dictionary");
  const vietnamese = entry.meanings.filter((m) => m.vietnamese);
  const shown = vietnamese.length > 0 ? vietnamese : entry.meanings.slice(0, 3);
  const withExample = entry.meanings.find((m) => m.example);
  // Meanings grouped by part of speech (noun, verb, adjective...), in the order the dictionary gives them.
  const groups = shown.reduce<{ pos: string | null; definitions: string[] }[]>((list, meaning) => {
    const group = list.find((g) => g.pos === meaning.pos);
    if (group) group.definitions.push(meaning.definition);
    else list.push({ pos: meaning.pos, definitions: [meaning.definition] });
    return list;
  }, []);

  const posList = [...new Set(entry.meanings.map((m) => m.pos).filter(Boolean))].join(", ");

  return (
    <div className="min-w-0 text-sm/relaxed">
      {showWord && (
        <p lang="en" className="text-lg font-bold tracking-tight break-words">
          {entry.word}
        </p>
      )}
      {(entry.ipa || collapsed) && (
        <p className="text-muted-foreground">
          {entry.ipa && <span lang="en">{entry.ipa}</span>}
          {/* Collapsed: the parts of speech stay visible, the meanings are behind "Show more". */}
          {collapsed && entry.ipa && posList && " · "}
          {collapsed && posList}
        </p>
      )}

      {!collapsed && shown.length > 0 && <div className="mt-3">
        {vietnamese.length > 0 ? (
          <p className="font-semibold">{t("vietnamese")}:</p>
        ) : (
          <p className="text-muted-foreground">{t("noVietnamese")}</p>
        )}
        <div className="mt-1.5 flex flex-col gap-2">
          {groups.map((group) => (
            <div key={group.pos ?? ""}>
              {group.pos && <span className="mb-0.5 inline-block rounded-full border px-2 py-0.5 text-xs font-semibold">{group.pos}</span>}
              <ul className={group.definitions.length > 1 ? "list-disc space-y-0.5 pl-5" : ""}>
                {group.definitions.map((definition) => (
                  <li key={definition} className={group.definitions.length > 1 ? "" : "list-none"}>
                    {definition}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>}

      {!collapsed && withExample?.example && (
        <div className="mt-3">
          <p className="text-muted-foreground">{t("example")}</p>
          <p lang="en" className="mt-0.5 font-normal italic">
            {withExample.example}
          </p>
        </div>
      )}
    </div>
  );
}
