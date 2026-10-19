"use client";

import { useEffect } from "react";

import { setAccent } from "@/lib/appearance";

/**
 * Makes this browser match the accent saved on the account (so a new device picks it up, and a colour removed
 * elsewhere goes away here). Renders nothing.
 */
export function AccentSeed({ color }: { color: string | null }) {
  useEffect(() => {
    setAccent(color);
  }, [color]);
  return null;
}
