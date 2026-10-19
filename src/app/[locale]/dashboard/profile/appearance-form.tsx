"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { setAccent } from "@/lib/appearance";
import { cn } from "@/lib/utils";
import { ACCENT_PRESETS, isLightAccent } from "@/modules/profile/domain/accent";

import { updateAccentAction } from "./actions";

/** The default accent is the black of the logo; it is stored as "no accent". */
const DEFAULT_BLACK = "#0a0a0a";

/** Picks the colour of the dark blocks and solid buttons from a few deep ready-made colours. Applies at once and saves on the account. */
export function AppearanceForm({ initialColor }: { initialColor: string | null }) {
  const t = useTranslations("ProfilePage.appearance");
  const [saved, setSaved] = useState<string | null>(initialColor);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  function choose(color: string | null) {
    const previous = saved;
    setMessage(null);
    setSaved(color);
    setAccent(color);
    startTransition(async () => {
      const result = await updateAccentAction(color);
      if (result.status === "error") {
        setSaved(previous);
        setAccent(previous);
        setMessage({ kind: "error", text: t.has(`errors.${result.code}`) ? t(`errors.${result.code}`) : t("errors.unknown") });
        return;
      }
      setMessage({ kind: "ok", text: color ? t("saved") : t("resetDone") });
    });
  }

  const toSwatch = (preset: (typeof ACCENT_PRESETS)[number]) => ({ id: preset.id, color: preset.color as string | null, shown: preset.color as string, label: t(`presets.${preset.id}`) });
  const groups = [
    { id: "deep", title: t("deepGroup"), swatches: [{ id: "default", color: null as string | null, shown: DEFAULT_BLACK, label: t("default") }, ...ACCENT_PRESETS.filter((p) => p.tone === "deep").map(toSwatch)] },
    { id: "medium", title: t("mediumGroup"), swatches: ACCENT_PRESETS.filter((p) => p.tone === "medium").map(toSwatch) },
    { id: "light", title: t("lightGroup"), swatches: ACCENT_PRESETS.filter((p) => p.tone === "light").map(toSwatch) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t("hint")}</p>

      <div role="radiogroup" aria-label={t("palette")} className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.id}>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{group.title}</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {group.swatches.map((swatch) => {
                const selected = swatch.color === saved;
                return (
                  <button
                    key={swatch.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={pending}
                    onClick={() => choose(swatch.color)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border p-2 text-xs font-medium transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60",
                      selected ? "border-2 border-foreground" : "hover:border-foreground"
                    )}
                  >
                    <span aria-hidden="true" className="flex h-10 w-full items-center justify-center rounded-lg" style={{ backgroundColor: swatch.shown }}>
                      {selected && <Check className={cn("size-5", isLightAccent(swatch.shown) ? "text-black" : "text-white")} />}
                    </span>
                    <span className="text-center leading-tight">{swatch.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={message.kind === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
