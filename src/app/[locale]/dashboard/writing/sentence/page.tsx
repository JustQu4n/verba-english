import { setRequestLocale } from "next-intl/server";

import { SentenceWriting } from "./sentence-writing";

// The locale param is only known per request; see the dashboard layout.
export const instant = false;

export default async function SentenceWritingPage({ params }: PageProps<"/[locale]/dashboard/writing/sentence">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SentenceWriting />;
}
