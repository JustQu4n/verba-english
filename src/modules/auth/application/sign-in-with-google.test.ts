import { describe, expect, it } from "vitest";

import { ValidationError } from "@/core/errors";
import { fakeAuth } from "@/test/fakes";

import { startGoogleSignIn } from "./sign-in-with-google";

const redirectTo = "http://localhost:3000/auth/callback";

describe("startGoogleSignIn", () => {
  it("GGL-AC-01: returns the Google consent screen URL", async () => {
    const auth = fakeAuth({ getOAuthSignInUrl: async () => "https://accounts.google.com/auth" });
    await expect(startGoogleSignIn(auth, redirectTo)).resolves.toBe("https://accounts.google.com/auth");
  });

  it("GGL-AC-01: requests the google provider with redirectTo", async () => {
    const auth = fakeAuth();
    await startGoogleSignIn(auth, redirectTo);
    expect(auth.getOAuthSignInUrl).toHaveBeenCalledExactlyOnceWith("google", redirectTo);
  });

  it.each(["", "not a url", "/auth/callback"])(
    "GGL-AC-02: invalid redirectTo (%j) → ValidationError, service not called",
    async (bad) => {
      const auth = fakeAuth();
      await expect(startGoogleSignIn(auth, bad)).rejects.toBeInstanceOf(ValidationError);
      expect(auth.getOAuthSignInUrl).not.toHaveBeenCalled();
    }
  );
});
