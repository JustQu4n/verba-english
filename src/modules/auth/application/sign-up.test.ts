import { describe, expect, it } from "vitest";

import { ValidationError } from "@/core/errors";
import { fakeAuth } from "@/test/fakes";

import { signUp } from "./sign-up";

const valid = { fullName: "Alex Lee", email: "a@b.com", password: "abcdef12" };
const redirectTo = "http://localhost:3000/auth/callback";

async function codes(input: unknown): Promise<string[]> {
  try {
    await signUp(fakeAuth(), input, redirectTo);
  } catch (error) {
    if (error instanceof ValidationError) {
      return (error.details as { message: string }[]).map((issue) => issue.message);
    }
    throw error;
  }
  return [];
}

describe("signUp", () => {
  it("AUTH-AC-05: no session → email confirmation required", async () => {
    const auth = fakeAuth({
      signUpWithPassword: async () => ({ needsEmailConfirmation: true }),
    });
    await expect(signUp(auth, valid, redirectTo)).resolves.toEqual({ needsEmailConfirmation: true });
  });

  it("AUTH-AC-06: session exists → no email confirmation needed", async () => {
    const auth = fakeAuth();
    await expect(signUp(auth, valid, redirectTo)).resolves.toEqual({ needsEmailConfirmation: false });
  });

  it("EML-AC-01: passes the normalized name and email, the password as typed and the redirect URL", async () => {
    const auth = fakeAuth();
    await signUp(auth, { fullName: "  Alex Lee ", email: " A@B.com ", password: "abcdef12" }, redirectTo);
    expect(auth.signUpWithPassword).toHaveBeenCalledExactlyOnceWith(valid, redirectTo);
  });

  it.each([
    ["", "name_required"],
    ["   ", "name_required"],
    [undefined, "name_required"],
    ["x".repeat(81), "name_too_long"],
  ])("EML-AC-02: full name %j → %s, service not called", async (fullName, code) => {
    const auth = fakeAuth();
    await expect(signUp(auth, { ...valid, fullName }, redirectTo)).rejects.toThrow(code);
    expect(auth.signUpWithPassword).not.toHaveBeenCalled();
  });

  it.each([
    ["abc123", "password_too_short"],
    ["abcdefgh", "password_weak"],
    ["12345678", "password_weak"],
    ["a1".repeat(37), "password_too_long"],
  ])("EML-AC-03: password %j → %s", async (password, code) => {
    expect(await codes({ ...valid, password })).toEqual([code]);
  });

  it("EML-AC-03: a password of exactly 8 and 72 characters with a letter and a digit is accepted", async () => {
    expect(await codes({ ...valid, password: "abcdefg1" })).toEqual([]);
    expect(await codes({ ...valid, password: "a1".repeat(36) })).toEqual([]);
  });

  it("EML-AC-04 / AUTH-AC-07: malformed data → ValidationError listing every field, service not called", async () => {
    const auth = fakeAuth();
    const input = { fullName: "", email: "x", password: "1" };
    await expect(signUp(auth, input, redirectTo)).rejects.toBeInstanceOf(ValidationError);
    expect(await codes(input)).toEqual(expect.arrayContaining(["name_required", "email_invalid", "password_too_short"]));
    expect(auth.signUpWithPassword).not.toHaveBeenCalled();
  });
});
