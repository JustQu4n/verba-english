export type Theme = "light" | "dark";

/**
 * The theme lives in a data attribute on <html>, not in a class: React owns the `class` of <html> and rewrites it
 * when the root layout re-renders (a language switch, a route change), which would silently drop the theme.
 * React never touches attributes it was not given.
 */
export const THEME_ATTRIBUTE = "data-theme";

/** Where the choice is kept (browser only). */
export const THEME_STORAGE_KEY = "theme";

/** A stored value counts only when it is exactly "light" or "dark"; anything else means "not chosen". */
export function parseTheme(value: unknown): Theme | null {
  return value === "light" || value === "dark" ? value : null;
}

/** The saved choice wins; with none, follow the operating system. */
export function resolveTheme(stored: unknown, prefersDark: boolean): Theme {
  return parseTheme(stored) ?? (prefersDark ? "dark" : "light");
}

export function nextTheme(current: Theme): Theme {
  return current === "dark" ? "light" : "dark";
}

/**
 * Runs in <head> before the first paint so the page never flashes the wrong theme. It must be plain ES5 and
 * self-contained (it is inlined as a string), and it mirrors resolveTheme. A blocked localStorage is not an error.
 */
export const THEME_INIT_SCRIPT = `(function(){var d=false;try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches)}catch(e){try{d=matchMedia("(prefers-color-scheme: dark)").matches}catch(_){}}document.documentElement.setAttribute("${THEME_ATTRIBUTE}",d?"dark":"light")})();`;
