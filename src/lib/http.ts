import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";

import { AppError } from "@/core/errors";

const STATUS_BY_CODE: Record<string, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
};

export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof AppError && error.code in STATUS_BY_CODE) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: STATUS_BY_CODE[error.code] }
    );
  }
  // Next control-flow errors (redirect, notFound, dynamic API) must propagate to the framework.
  unstable_rethrow(error);
  console.error(error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
    { status: 500 }
  );
}

/** Wraps a Route Handler: catches errors and maps AppError -> HTTP status. */
export function handle<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}
