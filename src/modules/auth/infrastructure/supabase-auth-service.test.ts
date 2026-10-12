import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { InfrastructureError, UnauthorizedError, ValidationError } from "@/core/errors";

import { SupabaseAuthService } from "./supabase-auth-service";

const creds = { email: "a@b.com", password: "123456" };

function serviceWith(auth: Record<string, unknown>) {
  return new SupabaseAuthService({ auth } as unknown as SupabaseClient);
}

describe("SupabaseAuthService", () => {
  it("AUTH-AC-04: wrong credentials → UnauthorizedError carrying the Supabase message", async () => {
    const service = serviceWith({
      signInWithPassword: vi.fn().mockResolvedValue({ error: { message: "Invalid login credentials" } }),
    });
    await expect(service.signInWithPassword(creds)).rejects.toThrow(UnauthorizedError);
    await expect(service.signInWithPassword(creds)).rejects.toThrow("Invalid login credentials");
  });

  it("AUTH-AC-01: successful sign-in does not throw", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    await serviceWith({ signInWithPassword }).signInWithPassword(creds);
    expect(signInWithPassword).toHaveBeenCalledWith(creds);
  });

  it("AUTH-AC-05: sign-up without session → email confirmation required; has redirect", async () => {
    const signUp = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
    const result = await serviceWith({ signUp }).signUpWithPassword(creds, "http://x/cb");
    expect(result).toEqual({ needsEmailConfirmation: true });
    expect(signUp).toHaveBeenCalledWith({ ...creds, options: { emailRedirectTo: "http://x/cb" } });
  });

  it("AUTH-AC-06: sign-up with session → no confirmation needed", async () => {
    const signUp = vi.fn().mockResolvedValue({ data: { session: { access_token: "t" } }, error: null });
    await expect(serviceWith({ signUp }).signUpWithPassword(creds, "http://x/cb")).resolves.toEqual({
      needsEmailConfirmation: false,
    });
  });

  it("AUTH-AC-08: Supabase rejects sign-up → ValidationError with the original message", async () => {
    const signUp = vi.fn().mockResolvedValue({ data: {}, error: { message: "User already registered" } });
    const promise = serviceWith({ signUp }).signUpWithPassword(creds, "http://x/cb");
    await expect(promise).rejects.toBeInstanceOf(ValidationError);
    await expect(promise).rejects.toThrow("User already registered");
  });

  it("AUTH-AC-09: invalid code → UnauthorizedError; valid code → success", async () => {
    const bad = serviceWith({
      exchangeCodeForSession: vi.fn().mockResolvedValue({ error: { message: "bad code" } }),
    });
    await expect(bad.exchangeCodeForSession("x")).rejects.toBeInstanceOf(UnauthorizedError);

    const ok = serviceWith({ exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }) });
    await expect(ok.exchangeCodeForSession("good")).resolves.toBeUndefined();
  });

  it("AUTH-AC-10: maps Supabase user → { id, email }; no user → null", async () => {
    const withUser = serviceWith({
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1", email: "a@b.com", extra: 1 } } }),
    });
    await expect(withUser.getCurrentUser()).resolves.toEqual({ id: "u1", email: "a@b.com" });

    const noUser = serviceWith({ getUser: vi.fn().mockResolvedValue({ data: { user: null } }) });
    await expect(noUser.getCurrentUser()).resolves.toBeNull();
  });

  it("AUTH-AC-11: sign-out calls Supabase signOut", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    await serviceWith({ signOut }).signOut();
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("GGL-AC-03: requests the Google URL with redirectTo and does not auto-redirect the browser", async () => {
    const url = "https://accounts.google.com/o/oauth2/v2/auth?client_id=abc";
    const signInWithOAuth = vi.fn().mockResolvedValue({ data: { url }, error: null });

    const result = await serviceWith({ signInWithOAuth }).getOAuthSignInUrl(
      "google",
      "http://localhost:3000/auth/callback"
    );

    expect(result).toBe(url);
    expect(signInWithOAuth).toHaveBeenCalledExactlyOnceWith({
      provider: "google",
      options: { redirectTo: "http://localhost:3000/auth/callback", skipBrowserRedirect: true },
    });
  });

  it.each([
    ["Supabase returns an error", { data: { url: null }, error: { message: "Unsupported provider: provider is not enabled" } }],
    ["no URL", { data: { url: null }, error: null }],
  ])("GGL-AC-04: %s → InfrastructureError, no details leaked", async (_name, response) => {
    const service = serviceWith({ signInWithOAuth: vi.fn().mockResolvedValue(response) });
    const promise = service.getOAuthSignInUrl("google", "http://x/cb");
    await expect(promise).rejects.toBeInstanceOf(InfrastructureError);
    await expect(promise).rejects.not.toThrow(/provider/i);
  });
});
