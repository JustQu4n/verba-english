import { describe, expect, it } from "vitest";

import { safeNextPath } from "./safe-redirect";

describe("safeNextPath", () => {
  it.each([
    ["/dashboard", "/dashboard"],
    ["/lessons/1?tab=vocab#top", "/lessons/1?tab=vocab#top"],
    ["/", "/"],
  ])("GGL-AC-05: keeps internal path %j", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });

  it.each([
    "https://evil.com",
    "http://evil.com/path",
    "//evil.com",
    "/\\evil.com",
    "\\\\evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
    "javascript:alert(1)",
    "dashboard",
    "",
  ])("GGL-AC-06: drops unsafe URL %j", (input) => {
    expect(safeNextPath(input)).toBe("/dashboard");
  });

  it.each([null, undefined])("GGL-AC-06: missing next (%s) → default", (input) => {
    expect(safeNextPath(input)).toBe("/dashboard");
  });

  it("GGL-AC-06: allows overriding the default page", () => {
    expect(safeNextPath("//evil.com", "/home")).toBe("/home");
  });
});
