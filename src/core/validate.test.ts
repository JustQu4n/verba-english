import { describe, expect, it } from "vitest";
import { z } from "zod";

import { ValidationError } from "./errors";
import { parseOrThrow } from "./validate";

const schema = z.object({ name: z.string().trim().min(1, "Empty name") });

describe("parseOrThrow", () => {
  it("CORE-AC-01: returns normalized data when valid", () => {
    expect(parseOrThrow(schema, { name: "  An " })).toEqual({ name: "An" });
  });

  it("CORE-AC-02: throws ValidationError with the first issue's message", () => {
    expect.assertions(3);
    try {
      parseOrThrow(schema, { name: " " });
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).code).toBe("VALIDATION_ERROR");
      expect((error as ValidationError).message).toBe("Empty name");
    }
  });
});
