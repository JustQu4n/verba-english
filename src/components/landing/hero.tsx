import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

import { GoogleIcon } from "./google-icon";
import { WritingDemo } from "./writing-demo";

export function Hero() {
  const t = useTranslations();
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-28 lg:pt-20">
      <div>
        <h1 className="max-w-[22ch] text-balance text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.5rem]">
          {t("Hero.title")}
        </h1>
        <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-muted-foreground">
          {t("Hero.subtitle")}
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="h-12 gap-3 bg-navy px-6 text-base text-white hover:bg-navy/90">
            <Link href="/login">
              <span className="grid size-6 place-items-center rounded-full bg-white">
                <GoogleIcon className="size-4" />
              </span>
              {t("Common.startWithGoogle")}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="h-12 px-5 text-base">
            <Link href="#cach-hoat-dong">{t("Hero.seeHow")}</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{t("Hero.note")}</p>
      </div>
      <div className="flex justify-center lg:justify-end">
        <WritingDemo />
      </div>
    </section>
  );
}
