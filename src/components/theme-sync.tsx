"use client";

import { useEffect } from "react";

import { applyStoredAppearance } from "@/lib/appearance";
import { THEME_ATTRIBUTE } from "@/lib/theme";

/**
 * The inline script in <head> only runs on a full page load. When the root layout is rebuilt on the client (a language
 * switch, a route change) the new <html> comes without the theme or the accent colour, so both are applied again here.
 */
export function ThemeSync() {
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      if (root.hasAttribute(THEME_ATTRIBUTE)) return;
      applyStoredAppearance(root);
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(root, { attributes: true, attributeFilter: [THEME_ATTRIBUTE] });
    return () => observer.disconnect();
  }, []);
  return null;
}
