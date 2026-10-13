import { describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/core/errors";
import { fakeAuth, fakeCredits } from "@/test/fakes";

import { getCredits } from "./get-credits";

describe("getCredits", () => {
  it("AIG-AC-15: returns the balance of the signed-in user", async () => {
    const credits = fakeCredits(42);
    const auth = fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue({ id: "u1", email: "a@b.c" }) });
    await expect(getCredits({ auth, credits })).resolves.toBe(42);
    expect(credits.balance).toHaveBeenCalledWith("u1");
  });

  it("AIG-AC-15: a guest is unauthorized and nothing is read", async () => {
    const credits = fakeCredits();
    await expect(getCredits({ auth: fakeAuth(), credits })).rejects.toBeInstanceOf(UnauthorizedError);
    expect(credits.balance).not.toHaveBeenCalled();
  });
});
