import { redirect } from "next/navigation";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InfrastructureError, UnauthorizedError } from "@/core/errors";

import { toActionError } from "./action-error";

afterEach(() => vi.restoreAllMocks());

describe("toActionError", () => {
  it("CORE-AC-07: keeps the message of business errors", () => {
    expect(toActionError(new UnauthorizedError("Wrong password"))).toBe("Wrong password");
  });

  it("CORE-AC-08: infrastructure and unknown errors show only a generic message", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const generic = "Something went wrong, please try again.";
    expect(toActionError(new InfrastructureError("db down"))).toBe(generic);
    expect(toActionError(new Error("boom"))).toBe(generic);
  });

  it("CORE-AC-10: Next control-flow errors are rethrown, not turned into an error message", () => {
    expect(() => {
      try {
        redirect("/login");
      } catch (error) {
        toActionError(error);
      }
    }).toThrow();
  });
});
