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

/** Where the learner's accent colour is kept in the browser (a copy of the one on their account). */
export const ACCENT_STORAGE_KEY = "accent";

/** Present on <html> while an accent is active; the colour itself is in the `--user-accent` variable. */
export const ACCENT_ATTRIBUTE = "data-accent";
export const ACCENT_VARIABLE = "--user-accent";

/** Set to "light" when the accent is light enough to need dark text on it. */
export const ACCENT_TONE_ATTRIBUTE = "data-accent-tone";

/**
 * Runs in <head> before the first paint so the page never flashes the wrong theme or accent. It must be plain ES5 and
 * self-contained (it is inlined as a string), and it mirrors resolveTheme. A blocked localStorage is not an error.
 * The accent is only a colour for CSS: a value that is not #rrggbb is ignored. It repeats isLightAccent.
 */
export const THEME_INIT_SCRIPT = `(function(){var r=document.documentElement,t=null,a=null,d=false;try{t=localStorage.getItem("${THEME_STORAGE_KEY}");a=localStorage.getItem("${ACCENT_STORAGE_KEY}")}catch(e){}try{d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches)}catch(e){}if(typeof a==="string"&&/^#[0-9a-f]{6}$/i.test(a)){a=a.toLowerCase();var c=function(i){var v=parseInt(a.substr(i,2),16)/255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};r.style.setProperty("${ACCENT_VARIABLE}",a);r.setAttribute("${ACCENT_ATTRIBUTE}","custom");if(0.2126*c(1)+0.7152*c(3)+0.0722*c(5)>0.179)r.setAttribute("${ACCENT_TONE_ATTRIBUTE}","light")}r.setAttribute("${THEME_ATTRIBUTE}",d?"dark":"light")})();`;
