import { unstable_rethrow } from "next/navigation";

import { AppError, InfrastructureError } from "@/core/errors";

/** Converts any error into a safe message to display in a form. */
export function toActionError(error: unknown): string {
  if (error instanceof AppError && !(error instanceof InfrastructureError)) {
    return error.message;
  }
  // Next control-flow errors (redirect, notFound, dynamic API) must propagate to the framework.
  unstable_rethrow(error);
  console.error(error);
  return "Something went wrong, please try again.";
}
