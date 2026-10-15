import { useTranslations } from "next-intl";

import { CATEGORIES, LEVELS } from "@/modules/writing/domain/sentence-catalog";

import { CATEGORY_ICONS } from "@/app/[locale]/dashboard/writing/sentence/category-icons";

/** Three bars that fill up with difficulty, like the level cards in the app. */
function Meter({ rank }: { rank: number }) {
  return (
    <span className="flex gap-1.5" aria-hidden="true">
      {LEVELS.map((level, index) => (
        <span key={level} className={`h-2 w-10 rounded-full bg-current ${index < rank ? "" : "opacity-20"}`} />
      ))}
    </span>
  );
}

export function LevelsTopics() {
  const t = useTranslations("Levels");
  const tSentence = useTranslations("Sentence");
  return (
    <section id="chu-de" className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8 lg:pb-28">
      <h2 className="display max-w-[16ch] text-balance text-4xl sm:text-5xl lg:text-6xl">{t("title")}</h2>
      <ul className="mt-14 divide-y border-y">
        {LEVELS.map((level, index) => (
          <li key={level} className="grid items-center gap-3 py-7 md:grid-cols-[1fr_1.2fr_auto] md:gap-8">
            <h3 className="display text-3xl sm:text-4xl">{tSentence(`levels.${level}.name`)}</h3>
            <p className="max-w-[46ch] leading-relaxed text-muted-foreground">{tSentence(`levels.${level}.description`)}</p>
            <Meter rank={index + 1} />
          </li>
        ))}
      </ul>

      <div className="mt-20 flex flex-wrap items-end justify-between gap-4">
        <h3 className="display text-3xl sm:text-4xl">{t("topicsTitle")}</h3>
        <p className="text-muted-foreground">{t("topicsBody")}</p>
      </div>
      <ul className="mt-8 flex flex-wrap gap-2.5">
        {CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category];
          return (
            <li
              key={category}
              className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
            >
              <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
              {tSentence(`categories.${category}`)}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
