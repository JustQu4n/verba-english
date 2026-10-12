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

  it("AUTH-AC-02: invalid email → ValidationError, service not called", async () => {
    const auth = fakeAuth();
    await expect(signIn(auth, { ...valid, email: "abc" })).rejects.toBeInstanceOf(ValidationError);
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("AUTH-AC-03: password shorter than 6 characters → ValidationError", async () => {
    await expect(signIn(fakeAuth(), { ...valid, password: "123" })).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  it("AUTH-AC-04: wrong credentials → UnauthorizedError from the service is preserved", async () => {
    const auth = fakeAuth({
      signInWithPassword: async () => {
        throw new UnauthorizedError("Invalid login credentials");
      },
    });
    await expect(signIn(auth, valid)).rejects.toThrow("Invalid login credentials");
  });
});
