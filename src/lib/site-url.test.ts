import { afterEach, describe, expect, it, vi } from "vitest";

import { getSiteUrl } from "./site-url";

afterEach(() => vi.unstubAllEnvs());

describe("getSiteUrl", () => {
  it("GGL-AC-12: uses NEXT_PUBLIC_SITE_URL and strips the trailing /", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://english.example.com//");
    expect(getSiteUrl()).toBe("https://english.example.com");
  });

  it("GGL-AC-12: not configured → http://localhost:3000", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});
