import { describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/core/errors";
import { fakeAuth, fakeAvatars, fakeProfiles, sampleProfile } from "@/test/fakes";

import { defaultAvatarUrl } from "../domain/avatar";
import { removeMyAvatar, uploadMyAvatar } from "./change-my-avatar";

const NEW_URL = "https://files.test/storage/v1/object/public/avatars/u1/new.webp";
const OLD_URL = "https://files.test/storage/v1/object/public/avatars/u1/old.webp";
const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 1, 2, 3]);

function setup(options: { avatarUrl?: string | null; signedIn?: boolean } = {}) {
  const { avatarUrl = OLD_URL, signedIn = true } = options;
  const auth = fakeAuth({ getCurrentUser: vi.fn().mockResolvedValue(signedIn ? { id: "u1", email: "a@b.c" } : null) });
  const profiles = fakeProfiles(sampleProfile({ avatarUrl }));
  const avatars = fakeAvatars();
  return { deps: { auth, profiles, avatars }, profiles, avatars };
}

describe("uploadMyAvatar", () => {
  it("PRP-AC-03: stores the picture, points the profile at it and deletes the previous one", async () => {
    const { deps, profiles, avatars } = setup();
    const result = await uploadMyAvatar(deps, webp);
    expect(avatars.upload).toHaveBeenCalledWith("u1", { bytes: webp, type: "image/webp" });
    expect(profiles.update).toHaveBeenCalledWith("u1", { avatarUrl: NEW_URL });
    expect(avatars.remove).toHaveBeenCalledWith("u1", OLD_URL);
    expect(result.avatarUrl).toBe(NEW_URL);
  });

  it("PRP-AC-03: with no previous picture nothing is deleted", async () => {
    const { deps, avatars } = setup({ avatarUrl: null });
    await uploadMyAvatar(deps, webp);
    expect(avatars.remove).not.toHaveBeenCalled();
  });

  it("PRP-AC-04: an empty, oversized or non-image file is rejected before anything is stored", async () => {
    const { deps, avatars, profiles } = setup();
    const big = new Uint8Array(512 * 1024 + 1);
    big.set(webp);
    for (const [bytes, code] of [
      [new Uint8Array(), "avatar_empty"],
      [big, "avatar_too_large"],
      [new TextEncoder().encode("<svg></svg>"), "avatar_type_invalid"],
    ] as const) {
      await expect(uploadMyAvatar(deps, bytes)).rejects.toMatchObject({ message: code });
    }
    expect(avatars.upload).not.toHaveBeenCalled();
    expect(profiles.update).not.toHaveBeenCalled();
  });

  it("PRP-AC-05: a guest is unauthorized and nothing is stored", async () => {
    const { deps, avatars } = setup({ signedIn: false });
    await expect(uploadMyAvatar(deps, webp)).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(removeMyAvatar(deps)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(avatars.upload).not.toHaveBeenCalled();
  });

  it("PRP-AC-06: when the profile cannot be updated the new file is deleted again and the error is kept", async () => {
    const { deps, avatars, profiles } = setup();
    vi.mocked(profiles.update).mockRejectedValue(new Error("db down"));
    await expect(uploadMyAvatar(deps, webp)).rejects.toThrow("db down");
    expect(avatars.remove).toHaveBeenCalledTimes(1);
    expect(avatars.remove).toHaveBeenCalledWith("u1", NEW_URL);
  });

  it("PRP-AC-06: failing to delete the old picture does not undo a successful change", async () => {
    const { deps, avatars } = setup();
    vi.mocked(avatars.remove).mockRejectedValue(new Error("storage down"));
    const quiet = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(uploadMyAvatar(deps, webp)).resolves.toMatchObject({ avatarUrl: NEW_URL });
    quiet.mockRestore();
  });
});

describe("removeMyAvatar", () => {
  it("PRP-AC-07: puts the default picture back on the profile and deletes the file", async () => {
    const { deps, profiles, avatars } = setup();
    const result = await removeMyAvatar(deps);
    expect(profiles.update).toHaveBeenCalledWith("u1", { avatarUrl: defaultAvatarUrl("u1") });
    expect(avatars.remove).toHaveBeenCalledWith("u1", OLD_URL);
    expect(result.avatarUrl).toBe(defaultAvatarUrl("u1"));
  });
});
