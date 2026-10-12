import { describe, expect, it } from "vitest";

import { ValidationError } from "@/core/errors";
import { fakeAuth } from "@/test/fakes";

import { signUp } from "./sign-up";

const valid = { email: "a@b.com", password: "123456" };
const redirectTo = "http://localhost:3000/auth/callback";

describe("signUp", () => {
  it("AUTH-AC-05: no session → email confirmation required, and redirectTo is passed", async () => {
    const auth = fakeAuth({
      signUpWithPassword: async () => ({ needsEmailConfirmation: true }),
    });
    await expect(signUp(auth, valid, redirectTo)).resolves.toEqual({
      needsEmailConfirmation: true,
    });
  });

  it("AUTH-AC-06: session exists → no email confirmation needed", async () => {
    const auth = fakeAuth();
    await expect(signUp(auth, valid, redirectTo)).resolves.toEqual({
      needsEmailConfirmation: false,
    });
    expect(auth.signUpWithPassword).toHaveBeenCalledWith(valid, redirectTo);
  });

  it("AUTH-AC-07: malformed data → ValidationError, service not called", async () => {
    const auth = fakeAuth();
    await expect(signUp(auth, { email: "x", password: "1" }, redirectTo)).rejects.toBeInstanceOf(
      ValidationError
    );
    expect(auth.signUpWithPassword).not.toHaveBeenCalled();
  });
});
