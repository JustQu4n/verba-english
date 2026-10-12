import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { updateSession } from "@/infrastructure/supabase/proxy";

const handleIntl = createIntlMiddleware(routing);

/** Next internal headers that the i18n response uses to rewrite/forward the request. */
const isForwardedHeader = (name: string) => name.startsWith("x-middleware-") || name === "link";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // api and auth have no locale prefix: only refresh the session.
  if (pathname.startsWith("/api") || pathname.startsWith("/auth")) return updateSession(request);

  const intl = handleIntl(request);
  // Locale redirects (e.g. /vi → /, or by cookie) go first, no need to read the session yet.
  if (intl.headers.has("location")) return intl;

  const response = await updateSession(request);
  if (response.headers.has("location")) return response;

  // Merge the locale rewrite and the NEXT_LOCALE cookie into the session-refreshed response.
  intl.headers.forEach((value, name) => {
    if (isForwardedHeader(name)) response.headers.set(name, value);
  });
  intl.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

