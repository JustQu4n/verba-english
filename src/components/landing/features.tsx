import { BookCheck, Footprints, History, Languages, PartyPopper, Puzzle, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const FEATURES: { key: string; icon: LucideIcon; dark?: boolean }[] = [
  { key: "reasons", icon: BookCheck, dark: true },
  { key: "natural", icon: Languages },
  { key: "structure", icon: Puzzle },
  { key: "progress", icon: Footprints },
  { key: "points", icon: PartyPopper },
  { key: "history", icon: History },
];

/** A little progress bar for the "progress" tile, like the ones on the topic cards. */
function MiniProgress() {
  return (
    <span aria-hidden="true" className="mt-6 flex items-center gap-3">
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/15">
        <span className="block h-full w-3/5 rounded-full bg-solid" />
      </span>
      <span className="text-xs font-semibold tabular-nums">3/5</span>
    </span>
  );
}

export function Features() {
  const t = useTranslations("Features");
  return (
    <section id="tinh-nang" className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
      <h2 className="display max-w-[16ch] text-balance text-4xl sm:text-5xl lg:text-6xl">{t("title")}</h2>
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ key, icon: Icon, dark }) => (
          <article
            key={key}
            className={cn(
              "flex flex-col rounded-3xl border p-7",
              dark ? "border-inverse bg-inverse text-inverse-foreground dark:border-white/10" : "bg-background"
            )}
          >
            <span
              className={cn("grid size-11 place-items-center rounded-2xl", dark ? "bg-inverse-foreground text-inverse" : "bg-solid text-on-solid")}
            >
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-6 text-xl font-bold tracking-tight">{t(`${key}Title`)}</h3>
            <p className={cn("mt-2 max-w-[44ch] leading-relaxed", dark ? "text-inverse-foreground/75" : "text-muted-foreground")}>
              {t(`${key}Body`)}
            </p>
            {key === "progress" && <MiniProgress />}
          </article>
        ))}
      </div>
    </section>
  );
}
