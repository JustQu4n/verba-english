import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["vi", "en"],
  defaultLocale: "vi",
  // Vietnamese (default) keeps the old URLs: /, /login, /dashboard. English has the /en prefix.
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
