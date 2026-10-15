"use client";

import { useEffect } from "react";

import { resolveTheme, THEME_ATTRIBUTE, THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * The inline script in <head> only runs on a full page load. When the root layout is rebuilt on the client (a language
 * switch, a route change) the new <html> comes without the theme, so it is applied again here.
 */
export function ThemeSync() {
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      if (root.hasAttribute(THEME_ATTRIBUTE)) return;
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(THEME_STORAGE_KEY);
      } catch {
        // Blocked storage: follow the system.
      }
      root.setAttribute(THEME_ATTRIBUTE, resolveTheme(stored, matchMedia("(prefers-color-scheme: dark)").matches));
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(root, { attributes: true, attributeFilter: [THEME_ATTRIBUTE] });
    return () => observer.disconnect();
  }, []);
  return null;
}
