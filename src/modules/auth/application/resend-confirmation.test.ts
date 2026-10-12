import { describe, expect, it } from "vitest";

import { fakeAuth } from "@/test/fakes";

import { resendConfirmation } from "./resend-confirmation";

const redirectTo = "http://localhost:3000/auth/callback";

describe("resendConfirmation", () => {
  it("EML-AC-08: sends the normalized email and the redirect URL to the service", async () => {
    const auth = fakeAuth();
    await resendConfirmation(auth, { email: " A@B.com " }, redirectTo);
    expect(auth.resendConfirmationEmail).toHaveBeenCalledExactlyOnceWith("a@b.com", redirectTo);
  });

  it.each(["abc", "", undefined])("EML-AC-04: invalid email %j → email_invalid, service not called", async (email) => {
    const auth = fakeAuth();
    await expect(resendConfirmation(auth, { email }, redirectTo)).rejects.toThrow("email_invalid");
    expect(auth.resendConfirmationEmail).not.toHaveBeenCalled();
  });
});
