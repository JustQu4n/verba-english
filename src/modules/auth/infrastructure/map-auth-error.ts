import { type AppError, InfrastructureError, UnauthorizedError, ValidationError } from "@/core/errors";

interface AuthApiError {
  code?: string;
  status?: number;
  message?: string;
}

/**
 * Turns a Supabase Auth error into an application error whose message is a stable reason code
 * (see auth-errors.ts). Unknown errors become InfrastructureError so nothing internal leaks.
 */
export function mapAuthError(error: AuthApiError): AppError {
  const { code, status, message } = error;

  if (code === "invalid_credentials" || message === "Invalid login credentials") {
    return new UnauthorizedError("invalid_credentials", { cause: error });
  }
  if (code === "email_not_confirmed") {
    return new UnauthorizedError("email_not_confirmed", { cause: error });
  }
  if (code === "user_already_exists" || code === "email_exists" || message === "User already registered") {
    return new ValidationError("email_taken");
  }
  if (code === "weak_password") {
    return new ValidationError("weak_password");
  }
  if (status === 429 || code === "over_request_rate_limit" || code === "over_email_send_rate_limit") {
    return new ValidationError("rate_limited");
  }
  return new InfrastructureError("Authentication service error", { cause: error });
}
