import { describe, expect, it } from "vitest";

import { InfrastructureError, UnauthorizedError, ValidationError } from "@/core/errors";

import { mapAuthError } from "./map-auth-error";

describe("mapAuthError", () => {
  it.each([
    [{ code: "invalid_credentials", message: "Invalid login credentials" }, UnauthorizedError, "invalid_credentials"],
    [{ message: "Invalid login credentials" }, UnauthorizedError, "invalid_credentials"],
    [{ code: "email_not_confirmed", message: "Email not confirmed" }, UnauthorizedError, "email_not_confirmed"],
    [{ code: "user_already_exists", message: "User already registered" }, ValidationError, "email_taken"],
    [{ code: "email_exists", message: "x" }, ValidationError, "email_taken"],
    [{ message: "User already registered" }, ValidationError, "email_taken"],
    [{ code: "weak_password", message: "Password should be at least 6 characters" }, ValidationError, "weak_password"],
    [{ code: "over_request_rate_limit", message: "x" }, ValidationError, "rate_limited"],
    [{ code: "over_email_send_rate_limit", message: "x" }, ValidationError, "rate_limited"],
    [{ status: 429, message: "x" }, ValidationError, "rate_limited"],
  ])("EML-AC-06: %j → %o(%s)", (error, ErrorClass, reason) => {
    const mapped = mapAuthError(error);
    expect(mapped).toBeInstanceOf(ErrorClass);
    expect(mapped.message).toBe(reason);
  });

  it("EML-AC-06: anything else → InfrastructureError without the original message", () => {
    const mapped = mapAuthError({ code: "unexpected_failure", message: "database exploded at 10.0.0.5" });
    expect(mapped).toBeInstanceOf(InfrastructureError);
    expect(mapped.message).not.toMatch(/10\.0\.0\.5/);
  });
});
