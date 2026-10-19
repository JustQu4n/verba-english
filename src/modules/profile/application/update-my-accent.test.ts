import { describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/core/errors";
import { fakeAuth, fakeProfiles } from "@/test/fakes";

import { updateMyAccent } from "./update-my-accent";

const signedIn = () => fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue({ id: "u1", email: "a@b.c" }) });

describe("updateMyAccent", () => {
  it("BGC-AC-04: saves an offered colour in lowercase for the signed-in user only", async () => {
    const profiles = fakeProfiles();
    const result = await updateMyAccent({ auth: signedIn(), profiles }, { color: " #0F1B3F " });
    expect(profiles.update).toHaveBeenCalledWith("u1", { accentColor: "#0f1b3f" });
    expect(result.accentColor).toBe("#0f1b3f");
  });

  it("BGC-AC-04: null clears the accent", async () => {
    const profiles = fakeProfiles();
    await updateMyAccent({ auth: signedIn(), profiles }, { color: null });
    expect(profiles.update).toHaveBeenCalledWith("u1", { accentColor: null });
  });

  it.each(["red", "#ff0000", "#fff", "#12345", "url(x)", "", 5, undefined])("BGC-AC-04: %j is rejected with invalid_color and nothing is saved", async (color) => {
    const profiles = fakeProfiles();
    await expect(updateMyAccent({ auth: signedIn(), profiles }, { color })).rejects.toMatchObject({ message: "invalid_color" });
    expect(profiles.update).not.toHaveBeenCalled();
  });

  it("BGC-AC-04: a guest is unauthorized and nothing is saved", async () => {
    const profiles = fakeProfiles();
    await expect(updateMyAccent({ auth: fakeAuth(), profiles }, { color: "#0f1b3f" })).rejects.toBeInstanceOf(UnauthorizedError);
    expect(profiles.update).not.toHaveBeenCalled();
  });
});
