import { getLocale } from "next-intl/server";
import { connection } from "next/server";
import type { ReactNode } from "react";

import { ForbiddenError, UnauthorizedError } from "@/core/errors";
import { redirect } from "@/i18n/navigation";
import { requireAdmin } from "@/modules/admin/application/require-admin";
import { getContainer } from "@/server/container";

import { AdminNotFound } from "./admin-not-found";

/**
 * Renders the admin area only for admins. Guests go to the login page; everyone else sees a plain "not found".
 * Every admin action checks the role again, so this gate is about the screens, not the data.
 */
export async function AdminGate({ children }: { children: ReactNode }) {
  // Request-time work: the session is read, and next-intl reads the clock.
  await connection();
  const { auth, roles } = await getContainer();
  const locale = await getLocale();
  try {
    await requireAdmin({ auth, roles });
  } catch (error) {
    if (error instanceof UnauthorizedError) return redirect({ href: "/login", locale });
    if (error instanceof ForbiddenError) return <AdminNotFound />;
    throw error;
  }
  return <>{children}</>;
}
