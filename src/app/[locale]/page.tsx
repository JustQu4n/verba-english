import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

import { CtaSection } from "@/components/landing/cta-section";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { GradingModes } from "@/components/landing/grading-modes";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LevelsTopics } from "@/components/landing/levels-topics";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { StatsStrip } from "@/components/landing/stats-strip";

// The locale param is only known per request; these routes are prerendered for every
// locale by generateStaticParams, so allow this segment to block instead of streaming it.
export const instant = false;

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations("Common");
  return (
    <div className="theme-mono landing flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-solid px-4 py-2 text-on-solid focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t("skipToContent")}
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Hero />
        <StatsStrip />
        <HowItWorks />
        <GradingModes />
        <Features />
        <LevelsTopics />
        <Faq />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
