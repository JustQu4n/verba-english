import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { localizePath, splitLocale } from "@/i18n/locale-path";

import { getSupabaseEnv } from "./env";

const PROTECTED_PREFIXES = ["/dashboard", "/admin"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Do not insert code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { locale, path } = splitLocale(request.nextUrl.pathname);
  if (!user && PROTECTED_PREFIXES.some((p) => path.startsWith(p))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = localizePath("/login", locale);
    const redirect = NextResponse.redirect(redirectUrl);
    // Keep the session cookies just refreshed/cleared, otherwise the browser keeps the old ones.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}
