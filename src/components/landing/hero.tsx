import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

import { GoogleIcon } from "./google-icon";
import { WritingDemo } from "./writing-demo";

export function Hero() {
  const t = useTranslations();
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:pb-28 lg:pt-20">
      <div>
        <h1 className="display text-[2.9rem] sm:text-7xl lg:text-[clamp(3rem,5.2vw,4.4rem)]">
          <span className="block">{t("Hero.title1")}</span>
          <span className="relative mt-1 block w-fit">
            {t("Hero.title2")}
            {/* A hand-drawn red underline, like a teacher's mark. */}
            <svg
              aria-hidden="true"
              viewBox="0 0 300 14"
              preserveAspectRatio="none"
              className="absolute -bottom-3 left-0 h-3 w-full text-pen"
            >
              <path
                d="M2 9 C 40 2, 70 13, 110 7 S 190 2, 230 8 S 280 11, 298 5"
                pathLength="1"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="lp-draw"
              />
            </svg>
          </span>
        </h1>
        <p className="mt-10 max-w-[50ch] text-lg leading-relaxed text-muted-foreground">{t("Hero.subtitle")}</p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="h-12 gap-3 rounded-full px-6 text-base">
            <Link href="/login">
              <span className="grid size-6 place-items-center rounded-full bg-white">
                <GoogleIcon className="size-4" />
              </span>
              {t("Common.startWithGoogle")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6 text-base">
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
