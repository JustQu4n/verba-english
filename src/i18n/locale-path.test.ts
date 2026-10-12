import { describe, expect, it } from "vitest";

import { localizePath, splitLocale } from "./locale-path";

describe("splitLocale", () => {
  it.each([
    ["/en/login", { locale: "en", path: "/login" }],
    ["/en", { locale: "en", path: "/" }],
    ["/login", { locale: "vi", path: "/login" }],
    ["/", { locale: "vi", path: "/" }],
    ["/english", { locale: "vi", path: "/english" }],
    ["/vi/login", { locale: "vi", path: "/login" }],
  ])("I18N-AC-04: splits the locale of %s", (input, expected) => {
    expect(splitLocale(input)).toEqual(expected);
  });
});

describe("localizePath", () => {
  it.each([
    ["/login", "vi", "/login"],
    ["/login", "en", "/en/login"],
    ["/", "en", "/en"],
    ["/", "vi", "/"],
    ["/dashboard", "en", "/en/dashboard"],
  ] as const)("I18N-AC-05: %s (%s) → %s", (path, locale, expected) => {
    expect(localizePath(path, locale)).toBe(expected);
  });
});
