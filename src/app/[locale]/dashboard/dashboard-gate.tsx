import { getLocale } from "next-intl/server";
import { connection } from "next/server";
import type { ReactNode } from "react";

import { redirect } from "@/i18n/navigation";
import { getContainer } from "@/server/container";

/**
 * Admins have no learner dashboard: they are sent to the admin area. Everyone else passes through.
 * A role lookup that fails counts as "not admin" (the reader fails closed), so learners are never blocked.
 */
export async function DashboardGate({ children }: { children: ReactNode }) {
  // Request-time work: the session is read, and next-intl reads the clock.
  await connection();
  const { auth, roles } = await getContainer();
  const user = await auth.getCurrentUser();
  if (user && (await roles.isAdmin(user.id))) {
    return redirect({ href: "/admin", locale: await getLocale() });
  }
  return <>{children}</>;
}
