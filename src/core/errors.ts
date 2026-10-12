/** Business error with a stable code that the presentation layer maps to HTTP/UI. */
export abstract class AppError extends Error {
  abstract readonly code: string;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  readonly code = "VALIDATION_ERROR";

  constructor(message: string, readonly details?: unknown) {
    super(message);
  }
}

export class UnauthorizedError extends AppError {
  readonly code = "UNAUTHORIZED";
}

export class NotFoundError extends AppError {
  readonly code = "NOT_FOUND";
}

/** Infrastructure error (DB, external services). Never show the original message to users. */
export class InfrastructureError extends AppError {
  readonly code = "INFRASTRUCTURE_ERROR";
}
