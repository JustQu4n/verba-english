"use client";

import { Coins, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface CreditsValue {
  /** Null until the balance is known (or when it could not be read). */
  credits: number | null;
  setCredits: (credits: number) => void;
  /** Leaderboard points; null until known. */
  points: number | null;
  setPoints: (points: number) => void;
}

const CreditsContext = createContext<CreditsValue | null>(null);

/**
 * Holds the balance for the whole signed-in area, so the navbar and the practice screen agree:
 * grading updates it here and the navbar follows without a reload.
 */
export function CreditsProvider({ children }: { children: ReactNode }) {
  const [credits, setCredits] = useState<number | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const value = useMemo(() => ({ credits, setCredits, points, setPoints }), [credits, points]);
  return <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>;
}

export function useCredits(): CreditsValue {
  const value = useContext(CreditsContext);
  if (!value) throw new Error("useCredits must be used inside <CreditsProvider>");
  return value;
}

/** Puts the balance read on the server into the provider. Renders nothing. */
export function CreditsSeed({ credits, points }: { credits: number | null; points: number | null }) {
  const { setCredits, setPoints } = useCredits();
  useEffect(() => {
    if (credits !== null) setCredits(credits);
    if (points !== null) setPoints(points);
  }, [credits, points, setCredits, setPoints]);
  return null;
}

/** Remaining AI credits, shown in the navbar. Renders nothing until the balance is known. */
export function HeaderCredits({ className }: { className?: string }) {
  const t = useTranslations("Header");
  const { credits } = useCredits();
  if (credits === null) return null;
  return (
    <p
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-sm font-medium tabular-nums sm:px-3",
        credits === 0 && "border-foreground bg-foreground text-background",
        className
      )}
    >
      <Coins className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="sr-only">{t("credits", { count: credits })}</span>
      <span aria-hidden="true" className="hidden sm:inline">
        {t("credits", { count: credits })}
      </span>
      <span aria-hidden="true" className="sm:hidden">
        {credits}
      </span>
    </p>
  );
}

/** Leaderboard points, shown in the navbar. Renders nothing until the total is known. */
export function HeaderPoints({ className }: { className?: string }) {
  const t = useTranslations("Header");
  const { points } = useCredits();
  if (points === null) return null;
  return (
    <p className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-sm font-medium tabular-nums sm:px-3", className)}>
      <Trophy className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="sr-only">{t("points", { count: points })}</span>
      <span aria-hidden="true" className="hidden sm:inline">
        {t("points", { count: points })}
      </span>
      <span aria-hidden="true" className="sm:hidden">
        {points}
      </span>
    </p>
  );
}
