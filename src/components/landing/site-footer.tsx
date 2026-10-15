import { useTranslations } from "next-intl";

import { Logo } from "./logo";

export function SiteFooter() {
  const t = useTranslations("Footer");
  return (
    <footer className="border-t border-inverse-foreground/15 bg-inverse text-inverse-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Logo className="text-base [&>span:first-child]:bg-inverse-foreground [&>span:first-child]:text-inverse" />
        <p className="display text-lg">{t("tagline")}</p>
      </div>
    </footer>
  );
}
