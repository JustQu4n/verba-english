"use server";

import { revalidatePath, updateTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { AppError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "@/core/errors";
import { updateUser } from "@/modules/admin/application/manage-user";
import { LEADERBOARD_TAG } from "@/server/cached-sources";
import { getContainer } from "@/server/container";

export type UserFormField = "role" | "credits" | "points";
export type UserFormState = undefined | { status: "saved" } | { status: "error"; code?: string; field?: UserFormField };

const FIELDS: readonly string[] = ["role", "credits", "points"];

/** A box left empty must be an error, not a silent 0, so it is sent on as text and the schema rejects it. */
const numberField = (data: FormData, name: string): number | string => {
  const raw = data.get(name);
  if (typeof raw !== "string" || raw.trim() === "") return "";
  return Number(raw);
};

function toState(error: unknown): UserFormState {
  if (error instanceof ValidationError && Array.isArray(error.details)) {
    const issue = (error.details as { path?: PropertyKey[]; message?: string }[])[0];
    const field = issue?.path?.[0];
    return { status: "error", code: issue?.message ?? error.message, field: typeof field === "string" && FIELDS.includes(field) ? (field as UserFormField) : undefined };
  }
  if (error instanceof UnauthorizedError || error instanceof ForbiddenError) return { status: "error", code: "unauthorized" };
  if (error instanceof NotFoundError) return { status: "error", code: "not_found" };
  // Next control-flow errors must propagate to the framework.
  if (!(error instanceof AppError)) unstable_rethrow(error);
  console.error(error);
  return { status: "error", code: "unknown" };
}

/** Saves role, credits and points of one account. The use case checks the caller is an admin. */
export async function updateUserAction(id: string, _: UserFormState, formData: FormData): Promise<UserFormState> {
  try {
    const { auth, roles, users } = await getContainer();
    const role = formData.get("role");
    await updateUser(
      { auth, roles, users },
      id,
      { ...(typeof role === "string" ? { role } : {}), credits: numberField(formData, "credits"), points: numberField(formData, "points") }
    );
  } catch (error) {
    return toState(error);
  }
  revalidatePath("/", "layout");
  // Points and names decide the cached leaderboard.
  updateTag(LEADERBOARD_TAG);
  return { status: "saved" };
}
