/**
 * Stable reason codes for authentication failures and invalid input. They are used as error
 * messages so the presentation layer can translate them; they are never shown as-is.
 */
export const AUTH_ERROR_CODES = [
  "name_required",
  "name_too_long",
  "email_invalid",
  "password_required",
  "password_too_short",
  "password_too_long",
  "password_weak",
  "password_mismatch",
  "invalid_credentials",
  "email_not_confirmed",
  "email_taken",
  "weak_password",
  "rate_limited",
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

export function isAuthErrorCode(value: unknown): value is AuthErrorCode {
  return typeof value === "string" && (AUTH_ERROR_CODES as readonly string[]).includes(value);
}
