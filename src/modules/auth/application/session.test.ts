import { describe, expect, it } from "vitest";

import { completeSignIn } from "./complete-sign-in";
import { getCurrentUser } from "./get-current-user";
import { signOut } from "./sign-out";
import { fakeAuth } from "@/test/fakes";

describe("session", () => {
  it("AUTH-AC-09: completes sign-in with the code from the confirmation link", async () => {
    const auth = fakeAuth();
    await completeSignIn(auth, "code-123");
    expect(auth.exchangeCodeForSession).toHaveBeenCalledExactlyOnceWith("code-123");
  });

  it("AUTH-AC-10: returns the current user when a session exists", async () => {
    const user = { id: "u1", email: "a@b.com" };
    const auth = fakeAuth({ getCurrentUser: async () => user });
    await expect(getCurrentUser(auth)).resolves.toEqual(user);
  });

  it("AUTH-AC-10: returns null when there is no session", async () => {
    await expect(getCurrentUser(fakeAuth())).resolves.toBeNull();
  });

  it("AUTH-AC-11: sign-out calls the service to end the session", async () => {
    const auth = fakeAuth();
    await signOut(auth);
    expect(auth.signOut).toHaveBeenCalledOnce();
  });
});
