import { routing, type Locale } from "./routing";

const { locales, defaultLocale } = routing;

/** Splits the locale prefix from the path. No prefix means the default locale. */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  for (const locale of locales) {
    if (pathname === `/${locale}`) return { locale, path: "/" };
    if (pathname.startsWith(`/${locale}/`)) return { locale, path: pathname.slice(locale.length + 1) };
  }
  return { locale: defaultLocale, path: pathname };
}

/** Joins an unprefixed path with a locale: the default locale has no prefix. */
export function localizePath(path: string, locale: Locale): string {
  if (locale === defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}
