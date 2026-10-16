import { describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/core/errors";
import { fakeAuth, fakeProfiles } from "@/test/fakes";

import { updateMyName } from "./update-my-profile";

const signedIn = () => fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue({ id: "u1", email: "a@b.c" }) });

describe("updateMyName", () => {
  it("PRP-AC-02: saves the trimmed name for the signed-in user only", async () => {
    const profiles = fakeProfiles();
    const result = await updateMyName({ auth: signedIn(), profiles }, { fullName: "  Lê Quốc  " });
    expect(profiles.update).toHaveBeenCalledWith("u1", { fullName: "Lê Quốc" });
    expect(result.fullName).toBe("Lê Quốc");
  });

  it("PRP-AC-02: an empty or over-long name is rejected with a code and nothing is saved", async () => {
    const profiles = fakeProfiles();
    for (const [fullName, code] of [["   ", "name_required"], ["a".repeat(81), "name_too_long"], [undefined, "name_required"]] as const) {
      await expect(updateMyName({ auth: signedIn(), profiles }, { fullName })).rejects.toMatchObject({ message: code });
    }
    expect(profiles.update).not.toHaveBeenCalled();
  });

  it("PRP-AC-02: a guest is unauthorized and nothing is saved", async () => {
    const profiles = fakeProfiles();
    await expect(updateMyName({ auth: fakeAuth(), profiles }, { fullName: "A" })).rejects.toBeInstanceOf(UnauthorizedError);
    expect(profiles.update).not.toHaveBeenCalled();
  });
});
