import { describe, expect, it } from "vitest";

import { UnauthorizedError, ValidationError } from "@/core/errors";
import { fakeAuth } from "@/test/fakes";

import { signIn } from "./sign-in";

const valid = { email: "a@b.com", password: "123456" };

describe("signIn", () => {
  it("AUTH-AC-01: passes valid credentials to the auth service", async () => {
    const auth = fakeAuth();
    await signIn(auth, valid);
    expect(auth.signInWithPassword).toHaveBeenCalledExactlyOnceWith(valid);
  });

  it("EML-AC-04: normalizes the email (trim, lower case) before calling the service", async () => {
    const auth = fakeAuth();
    await signIn(auth, { email: "  A@B.com ", password: "123456" });
    expect(auth.signInWithPassword).toHaveBeenCalledWith(valid);
  });

  it.each(["abc", "", "   ", undefined, null])(
    "AUTH-AC-02 / EML-AC-04: invalid email %j → email_invalid, service not called",
    async (email) => {
      const auth = fakeAuth();
      const promise = signIn(auth, { ...valid, email });
      await expect(promise).rejects.toBeInstanceOf(ValidationError);
      await expect(promise).rejects.toThrow("email_invalid");
      expect(auth.signInWithPassword).not.toHaveBeenCalled();
    }
  );

  it.each(["", undefined, null])(
    "AUTH-AC-03 / EML-AC-05: empty password %j → password_required",
    async (password) => {
      const auth = fakeAuth();
      const promise = signIn(auth, { ...valid, password });
      await expect(promise).rejects.toThrow("password_required");
      expect(auth.signInWithPassword).not.toHaveBeenCalled();
    }
  );

  it("EML-AC-05: a short legacy password is still passed to the service", async () => {
    const auth = fakeAuth();
    await signIn(auth, { ...valid, password: "abc" });
    expect(auth.signInWithPassword).toHaveBeenCalledOnce();
  });

  it("AUTH-AC-04: wrong credentials → the service's UnauthorizedError is preserved", async () => {
    const auth = fakeAuth({
      signInWithPassword: async () => {
        throw new UnauthorizedError("invalid_credentials");
      },
    });
    await expect(signIn(auth, valid)).rejects.toThrow("invalid_credentials");
  });
});
