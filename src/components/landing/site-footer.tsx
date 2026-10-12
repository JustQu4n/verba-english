import { useTranslations } from "next-intl";

import { Logo } from "./logo";

export function SiteFooter() {
  const t = useTranslations("Footer");
  return (
    <footer className="border-t border-rule bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Logo className="text-base" />
        <p className="text-sm text-muted-foreground">{t("tagline")}</p>
      </div>
    </footer>
  );
}
