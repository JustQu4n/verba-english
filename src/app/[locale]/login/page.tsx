import { setRequestLocale } from "next-intl/server";

import { LoginView } from "./login-view";

// The locale param is only known per request; these routes are prerendered for every
// locale by generateStaticParams, so allow this segment to block instead of streaming it.
export const instant = false;

export default async function LoginPage({ params }: PageProps<"/[locale]/login">) {
  setRequestLocale((await params).locale);
  return <LoginView />;
}
