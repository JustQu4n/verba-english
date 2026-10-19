import { isLightAccent, parseAccent } from "@/modules/profile/domain/accent";

import { ACCENT_ATTRIBUTE, ACCENT_STORAGE_KEY, ACCENT_TONE_ATTRIBUTE, ACCENT_VARIABLE, resolveTheme, THEME_ATTRIBUTE, THEME_STORAGE_KEY, type Theme } from "./theme";

/** The part of <html> that appearance touches (a real element, or a stand-in in tests). */
export interface AppearanceRoot {
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  style: { setProperty(name: string, value: string): void; removeProperty(name: string): void };
}

/** Puts the accent on <html> (and says whether it needs dark text); null removes it (back to the default black). */
export function applyAccent(root: AppearanceRoot, color: string | null): void {
  if (color) {
    root.style.setProperty(ACCENT_VARIABLE, color);
    root.setAttribute(ACCENT_ATTRIBUTE, "custom");
    if (isLightAccent(color)) root.setAttribute(ACCENT_TONE_ATTRIBUTE, "light");
    else root.removeAttribute(ACCENT_TONE_ATTRIBUTE);
  } else {
    root.style.removeProperty(ACCENT_VARIABLE);
    root.removeAttribute(ACCENT_ATTRIBUTE);
    root.removeAttribute(ACCENT_TONE_ATTRIBUTE);
  }
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** The light/dark theme the browser has saved, or the system's. */
export function readStoredTheme(): Theme {
  return resolveTheme(read(THEME_STORAGE_KEY), matchMedia("(prefers-color-scheme: dark)").matches);
}

/** Sets the theme and the accent saved in this browser. Used when <html> was rebuilt without them. */
export function applyStoredAppearance(root: AppearanceRoot): void {
  root.setAttribute(THEME_ATTRIBUTE, readStoredTheme());
  applyAccent(root, parseAccent(read(ACCENT_STORAGE_KEY)));
}

/** Remembers the accent in this browser (null forgets it). A blocked store only means it is not remembered. */
export function storeAccent(color: string | null): void {
  try {
    if (color) localStorage.setItem(ACCENT_STORAGE_KEY, color);
    else localStorage.removeItem(ACCENT_STORAGE_KEY);
  } catch {
    // Applied for this visit only.
  }
}

/** Applies an accent now and remembers it; null returns to the default black. */
export function setAccent(color: string | null): void {
  const valid = parseAccent(color);
  storeAccent(valid);
  applyAccent(document.documentElement, valid);
}
