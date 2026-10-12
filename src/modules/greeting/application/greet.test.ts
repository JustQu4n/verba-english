import { describe, expect, it } from "vitest";

import { ValidationError } from "@/core/errors";

import { greet } from "./greet";

describe("greet", () => {
  it("GRT-AC-01: greets with the trimmed name", () => {
    expect(greet({ name: "  Alex " })).toBe("Hello, Alex!");
  });

  it.each([{ name: "" }, { name: "   " }])(
    "GRT-AC-02: empty/whitespace name is rejected (%j)",
    (input) => {
      expect(() => greet(input)).toThrow(ValidationError);
      expect(() => greet(input)).toThrow("Name must not be empty");
    }
  );

  it.each([null, undefined, {}, { name: 5 }, "abc"])(
    "GRT-AC-03: missing or wrong-typed data is rejected (%j)",
    (input) => {
      expect(() => greet(input)).toThrow(ValidationError);
    }
  );
});
