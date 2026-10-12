import { z } from "zod";

import { parseOrThrow } from "@/core/validate";

import type { AuthService } from "./auth-service";

const redirectToSchema = z.url("Invalid return URL");

/** Starts Google sign-in; returns the URL to redirect the user to. */
export async function startGoogleSignIn(auth: AuthService, redirectTo: string): Promise<string> {
  return auth.getOAuthSignInUrl("google", parseOrThrow(redirectToSchema, redirectTo));
}
