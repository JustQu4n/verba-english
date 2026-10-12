import { afterEach, describe, expect, it, vi } from "vitest";

import { getSiteUrl, resolveSiteUrl } from "./site-url";

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

const headers = (values: Record<string, string>) => ({
  get: (name: string) => values[name.toLowerCase()] ?? null,
});

describe("resolveSiteUrl", () => {
  it("GGL-AC-13: uses the request host over a wrong NEXT_PUBLIC_SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    expect(resolveSiteUrl(headers({ host: "english.example.com" }))).toBe("https://english.example.com");
  });

  it("GGL-AC-13: prefers x-forwarded-host and x-forwarded-proto behind a proxy", () => {
    const h = headers({ host: "internal:3000", "x-forwarded-host": "app.example.com", "x-forwarded-proto": "https" });
    expect(resolveSiteUrl(h)).toBe("https://app.example.com");
  });

  it("GGL-AC-13: takes the first value of a comma-separated forwarded list", () => {
    const h = headers({ "x-forwarded-host": "app.example.com, proxy.internal", "x-forwarded-proto": "https, http" });
    expect(resolveSiteUrl(h)).toBe("https://app.example.com");
  });

  it.each(["localhost:3000", "127.0.0.1:3000"])("GGL-AC-13: %s defaults to http", (host) => {
    expect(resolveSiteUrl(headers({ host }))).toBe(`http://${host}`);
  });

  it.each<Record<string, string>>([{}, { host: "evil.com/path?x=1" }, { host: "a b" }, { host: "x@evil.com" }])(
    "GGL-AC-13: missing or invalid host %j falls back to the configured URL",
    (values) => {
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://configured.example.com");
      expect(resolveSiteUrl(headers(values))).toBe("https://configured.example.com");
    }
  );

  it("GGL-AC-13: an unsupported forwarded protocol is ignored", () => {
    const h = headers({ host: "english.example.com", "x-forwarded-proto": "javascript" });
    expect(resolveSiteUrl(h)).toBe("https://english.example.com");
  });
});
