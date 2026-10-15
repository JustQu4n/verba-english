import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

import { GoogleIcon } from "./google-icon";

export function CtaSection() {
  const t = useTranslations();
  return (
    <section className="relative overflow-hidden bg-inverse text-inverse-foreground">
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-5 pb-10 pt-20 sm:px-8 lg:pt-28">
        <h2 className="display max-w-[14ch] text-balance text-5xl sm:text-6xl lg:text-7xl">{t("Cta.title")}</h2>
        <p className="max-w-[46ch] leading-relaxed text-inverse-foreground/70">{t("Cta.body")}</p>
        <Button asChild size="lg" className="h-12 gap-3 rounded-full bg-inverse-foreground px-6 text-base text-inverse hover:bg-inverse-foreground/90">
          <Link href="/login">
            <GoogleIcon className="size-5" />
            {t("Common.startWithGoogle")}
          </Link>
        </Button>
      </div>
      {/* The wordmark, huge and cropped, like the logo blown up. */}
      <p
        aria-hidden="true"
        className="display pointer-events-none mt-6 select-none whitespace-nowrap px-4 text-center text-[27vw] leading-[0.8] text-inverse-foreground/[0.13] sm:text-[22vw] lg:text-[17rem]"
      >
        VERBA
      </p>
    </section>
  );
}
