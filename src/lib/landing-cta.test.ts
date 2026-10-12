import { redirect } from "next/navigation";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Profile } from "@/modules/profile/domain/profile";

import { resolveAuthCta } from "./landing-cta";

afterEach(() => vi.restoreAllMocks());

const user = { id: "u1", email: "quoc@example.com" };
const profile: Profile = {
  id: "u1",
  fullName: "Lê Quốc",
  avatarUrl: "https://lh3.googleusercontent.com/a/abc",
  createdAt: new Date("2026-01-01"),
};
const GUEST = { kind: "guest", href: "/login", label: "Sign in" };

describe("resolveAuthCta", () => {
  it("LND-AC-01: signed in → member with display profile and dashboard link", async () => {
    const cta = await resolveAuthCta(async () => user, async () => profile);
    expect(cta).toEqual({
      kind: "member",
      href: "/dashboard",
      label: "Go to dashboard",
      profile: {
        name: "Lê Quốc",
        email: "quoc@example.com",
        initials: "LQ",
        avatarUrl: "https://lh3.googleusercontent.com/a/abc",
      },
    });
  });

  it("LND-AC-02: signed out → guest, profile not read", async () => {
    const loadProfile = vi.fn();
    const cta = await resolveAuthCta(async () => null, loadProfile);
    expect(cta).toEqual(GUEST);
    expect(loadProfile).not.toHaveBeenCalled();
  });

  it("LND-AC-03: session read error → guest, page not broken", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const cta = await resolveAuthCta(
      async () => {
        throw new Error("Supabase environment variable missing");
      },
      async () => profile
    );
    expect(cta).toEqual(GUEST);
  });

  it("LND-AC-03: Next control-flow errors are still rethrown", async () => {
    await expect(
      resolveAuthCta(async () => redirect("/login"), async () => profile)
    ).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_REDIRECT") });
  });

  it("NAV-AC-06: profile read error → still a member, name/email from the account, no avatar", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const cta = await resolveAuthCta(
      async () => user,
      async () => {
        throw new Error("db down");
      }
    );
    expect(cta).toMatchObject({
      kind: "member",
      profile: { name: "quoc", email: "quoc@example.com", initials: "Q", avatarUrl: null },
    });
  });

  it("NAV-AC-06: no profile (null) → still a member with fallback values", async () => {
    const cta = await resolveAuthCta(async () => user, async () => null);
    expect(cta).toMatchObject({ kind: "member", profile: { name: "quoc", avatarUrl: null } });
  });

  it("NAV-AC-06: control-flow errors while reading the profile are still rethrown", async () => {
    await expect(
      resolveAuthCta(async () => user, async () => redirect("/login"))
    ).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_REDIRECT") });
  });
});
