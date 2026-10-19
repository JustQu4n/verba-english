import { describe, expect, it } from "vitest";

import type { Profile } from "@/modules/profile/domain/profile";

import { toDisplayProfile } from "./profile-display";

const user = { id: "u1", email: "quoc@example.com" };
const profile = (over: Partial<Profile> = {}): Profile => ({
  id: "u1",
  fullName: "Lê Quốc",
  avatarUrl: "https://lh3.googleusercontent.com/a/abc",
  accentColor: null,
  createdAt: new Date("2026-01-01"),
  ...over,
});

describe("toDisplayProfile", () => {
  it("NAV-AC-01: uses the full name with extra whitespace trimmed", () => {
    expect(toDisplayProfile(user, profile({ fullName: "  Lê Quốc " })).name).toBe("Lê Quốc");
  });

  it.each([null, "", "   "])("NAV-AC-02: name %j → uses the part of the email before @", (fullName) => {
    expect(toDisplayProfile(user, profile({ fullName })).name).toBe("quoc");
  });

  it("NAV-AC-02: a generic name can be passed in per locale", () => {
    expect(toDisplayProfile({ id: "u1", email: null }, null, "User").name).toBe("User");
  });

  it("NAV-AC-02: no profile and no email → User", () => {
    expect(toDisplayProfile({ id: "u1", email: null }, null).name).toBe("User");
    expect(toDisplayProfile({ id: "u1", email: "@x.com" }, null).name).toBe("User");
  });

  it.each([
    ["Lê Quốc", "LQ"],
    ["Nguyễn Văn An", "NA"],
    ["an", "A"],
    ["  đặng   thị  ánh ", "ĐÁ"],
    ["Người dùng", "ND"],
  ])("NAV-AC-03: initials of %j is %j", (fullName, initials) => {
    expect(toDisplayProfile(user, profile({ fullName })).initials).toBe(initials);
  });

  it("NAV-AC-03: names in decomposed form (NFD) still yield the correct accented letters", () => {
    const nfd = "Lê Quốc".normalize("NFD");
    expect(toDisplayProfile(user, profile({ fullName: nfd })).initials).toBe("LQ");
  });

  it("NAV-AC-04: keeps https avatar URLs", () => {
    expect(toDisplayProfile(user, profile()).avatarUrl).toBe("https://lh3.googleusercontent.com/a/abc");
  });

  it.each([
    "http://example.com/a.png",
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "//example.com/a.png",
    "not a url",
    "",
  ])("NAV-AC-04: drops unsafe avatar URLs %j", (avatarUrl) => {
    expect(toDisplayProfile(user, profile({ avatarUrl })).avatarUrl).toBeNull();
  });

  it("NAV-AC-04: no profile → no avatar", () => {
    expect(toDisplayProfile(user, null).avatarUrl).toBeNull();
  });

  it("NAV-AC-05: keeps email; missing email → empty string", () => {
    expect(toDisplayProfile(user, profile()).email).toBe("quoc@example.com");
    expect(toDisplayProfile({ id: "u1", email: null }, profile()).email).toBe("");
  });
});
