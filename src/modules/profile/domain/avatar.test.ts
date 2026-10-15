import { describe, expect, it } from "vitest";

import { defaultAvatarUrl, detectAvatarType, isDefaultAvatar } from "./avatar";

const bytes = (...values: number[]) => new Uint8Array(values);
const webp = bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 1);

describe("detectAvatarType", () => {
  it("PRP-AC-01: recognises JPEG, PNG and WebP by their first bytes", () => {
    expect(detectAvatarType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(detectAvatarType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))).toBe("image/png");
    expect(detectAvatarType(webp)).toBe("image/webp");
  });

  it("PRP-AC-01: anything else is refused, whatever its name says", () => {
    expect(detectAvatarType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(detectAvatarType(new TextEncoder().encode("GIF89a"))).toBeNull();
    expect(detectAvatarType(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x41, 0x56, 0x49, 0x20))).toBeNull();
    expect(detectAvatarType(new Uint8Array())).toBeNull();
  });
});

describe("default avatar", () => {
  it("PRP-AC-16: the default picture is an https address that depends only on the user id", () => {
    const url = defaultAvatarUrl("3f2a-uuid");
    expect(new URL(url).protocol).toBe("https:");
    expect(url).toContain("seed=3f2a-uuid");
    expect(defaultAvatarUrl("3f2a-uuid")).toBe(url);
    expect(defaultAvatarUrl("other")).not.toBe(url);
  });

  it("PRP-AC-16: the id is escaped, so it cannot add parameters to the address", () => {
    expect(defaultAvatarUrl("a&seed=b")).toContain("seed=a%26seed%3Db");
  });

  it("PRP-AC-16: only the generated picture counts as the default", () => {
    expect(isDefaultAvatar(defaultAvatarUrl("u1"))).toBe(true);
    expect(isDefaultAvatar("https://abc.supabase.co/storage/v1/object/public/avatars/u1/a.webp")).toBe(false);
    expect(isDefaultAvatar("https://lh3.googleusercontent.com/a/photo")).toBe(false);
    expect(isDefaultAvatar(null)).toBe(false);
  });
});
