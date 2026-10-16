import { z } from "zod";

import { NotFoundError, ValidationError } from "@/core/errors";
import { parseOrThrow } from "@/core/validate";
import type { AuthService } from "@/modules/auth/application/auth-service";

import { ACCOUNT_ROLES, MAX_CREDITS, MAX_POINTS, type AdminOverview, type UserAccount } from "../domain/user-account";
import { requireAdmin } from "./require-admin";
import type { RoleReader } from "./role-reader";
import type { UserDirectory } from "./user-directory";

interface Deps {
  auth: AuthService;
  roles: RoleReader;
  users: UserDirectory;
}

const UUID = z.uuid();

/** A malformed id can never match an account, so it is "not found" without asking the database. */
const idOf = (id: unknown): string => {
  const parsed = UUID.safeParse(id);
  if (!parsed.success) throw new NotFoundError("Account not found");
  return parsed.data;
};

export async function getUser(deps: Deps, id: unknown): Promise<UserAccount> {
  await requireAdmin(deps);
  const user = await deps.users.find(idOf(id));
  if (!user) throw new NotFoundError("Account not found");
  return user;
}

export async function getOverview(deps: Deps): Promise<AdminOverview> {
  await requireAdmin(deps);
  return deps.users.overview();
}

const whole = (max: number, code: string) => z.number({ error: code }).int(code).min(0, code).max(max, code);

/** Messages are codes the form translates, never display text. */
const patchSchema = z.object({
  role: z.enum(ACCOUNT_ROLES, { error: "role_invalid" }).optional(),
  credits: whole(MAX_CREDITS, "credits_invalid").optional(),
  points: whole(MAX_POINTS, "points_invalid").optional(),
});

/**
 * Changes the role, credits or points of an account. An admin cannot change their own role, so the last admin can
 * never lock everyone out and nobody loses access by a misclick.
 */
export async function updateUser(deps: Deps, id: unknown, input: unknown): Promise<UserAccount> {
  const actor = await requireAdmin(deps);
  const userId = idOf(id);
  const patch = parseOrThrow(patchSchema, input);

  const current = await deps.users.find(userId);
  if (!current) throw new NotFoundError("Account not found");
  if (patch.role !== undefined && patch.role !== current.role && actor.id === userId) {
    throw new ValidationError("cannot_change_own_role", [{ path: ["role"], message: "cannot_change_own_role" }]);
  }

  const updated = await deps.users.update(userId, patch);
  if (!updated) throw new NotFoundError("Account not found");
  return updated;
}
