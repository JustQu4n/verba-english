import { NextResponse, type NextRequest } from "next/server";

import { completeSignIn } from "@/modules/auth/application/complete-sign-in";
import { safeNextPath } from "@/lib/safe-redirect";
import { getContainer } from "@/server/container";

export type CallbackError = "oauth_failed" | "missing_code" | "auth_failed";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const toLogin = (error: CallbackError) =>
    NextResponse.redirect(`${origin}/login?error=${error}`);

  // Google/Supabase reported an error (e.g. the user clicked Cancel).
  if (searchParams.has("error")) return toLogin("oauth_failed");

  const code = searchParams.get("code");
  if (!code) return toLogin("missing_code");

  try {
    const { auth } = await getContainer();
    await completeSignIn(auth, code);
  } catch {
    return toLogin("auth_failed");
  }

  return NextResponse.redirect(`${origin}${safeNextPath(searchParams.get("next"))}`);
}
