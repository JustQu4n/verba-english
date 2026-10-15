"use client";

import { useEffect, useState } from "react";

import { progressPercent, type SentenceProgress } from "@/modules/writing/domain/sentence-progress";

interface CategoryProgressProps {
  label: string;
  /** Null while the numbers are still loading. */
  progress: SentenceProgress | null;
}

/**
 * The progress line at the bottom of a category card. It always takes the same height, so the card never grows
 * when the numbers arrive; a pulsing track shows while they load, then the bar runs from empty to its value.
 */
export function CategoryProgress({ label, progress }: CategoryProgressProps) {
  const target = progress ? progressPercent(progress) : 0;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    // One frame at 0 first, so the width actually animates instead of appearing already filled.
    const frame = requestAnimationFrame(() => setShown(target));
    return () => cancelAnimationFrame(frame);
  }, [target]);

  if (!progress) {
    return <span aria-hidden="true" className="block h-4 w-full animate-pulse rounded-full bg-current/10 motion-reduce:animate-none" />;
  }
  if (progress.total === 0) return <span aria-hidden="true" className="block h-4" />;

  return (
    <span className="flex h-4 items-center gap-2">
      <span
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-valuenow={progress.completed}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-current/20"
      >
        <span
          className="block h-full rounded-full bg-current transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{ width: `${shown}%` }}
        />
      </span>
      <span className="shrink-0 text-xs tabular-nums opacity-70">
        {progress.completed}/{progress.total}
      </span>
    </span>
  );
}
