import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

import { GoogleIcon } from "./google-icon";

export function CtaSection() {
  const t = useTranslations();
  return (
    <section className="bg-navy text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-5 py-20 sm:px-8 md:flex-row md:items-center md:justify-between lg:py-24">
        <div>
          <h2 className="max-w-[20ch] text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {t("Cta.title")}
          </h2>
          <p className="mt-4 max-w-[46ch] leading-relaxed text-white/75">
            {t("Cta.body")}
          </p>
        </div>
        <Button asChild size="lg" className="h-12 shrink-0 gap-3 bg-white px-6 text-base text-navy hover:bg-white/90">
          <Link href="/login">
            <GoogleIcon className="size-5" />
            {t("Common.startWithGoogle")}
          </Link>
        </Button>
      </div>
    </section>
  );
}
