import { describe, expect, it, vi } from "vitest";

import { InfrastructureError, UnauthorizedError, ValidationError } from "@/core/errors";

import { toFormErrors } from "./form-errors";

vi.mock("next/navigation", () => ({
  unstable_rethrow: (error: unknown) => {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
  },
}));

describe("toFormErrors", () => {
  it("EML-AC-09: maps zod issues to the field named by their path", () => {
    const error = new ValidationError("email_invalid", [
      { path: ["email"], message: "email_invalid" },
      { path: ["password"], message: "password_weak" },
      { path: ["password"], message: "password_too_short" },
    ]);
    expect(toFormErrors(error)).toEqual({
      fieldErrors: { email: "email_invalid", password: "password_weak" },
    });
  });

  it.each([
    [new UnauthorizedError("invalid_credentials"), "invalid_credentials"],
    [new UnauthorizedError("email_not_confirmed"), "email_not_confirmed"],
    [new ValidationError("email_taken"), "email_taken"],
    [new ValidationError("rate_limited"), "rate_limited"],
  ])("EML-AC-09: %o → formError %s", (error, code) => {
    expect(toFormErrors(error)).toEqual({ formError: code });
  });

  it("EML-AC-09: an unexpected error is logged and becomes `unknown` without leaking details", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(toFormErrors(new InfrastructureError("db at 10.0.0.5 down"))).toEqual({ formError: "unknown" });
    expect(toFormErrors(new Error("boom"))).toEqual({ formError: "unknown" });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("EML-AC-09: Next control-flow errors are rethrown", () => {
    expect(() => toFormErrors(new Error("NEXT_REDIRECT"))).toThrow("NEXT_REDIRECT");
  });
});
