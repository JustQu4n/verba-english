import { z } from "zod";

import { parseOrThrow } from "@/core/validate";

import {
  ACCOUNT_ROLES,
  MAX_SEARCH_LENGTH,
  USER_ORDERS,
  USERS_PAGE_SIZE,
  type AccountRole,
  type UserAccount,
  type UserOrder,
} from "../domain/user-account";
import { requireAdmin } from "./require-admin";
import type { RoleReader } from "./role-reader";
import type { UserDirectory } from "./user-directory";
import type { AuthService } from "@/modules/auth/application/auth-service";

/** The values come from the URL: anything that is not a positive whole number means the first page. */
const toPage = (value: unknown) => {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isInteger(n) && n >= 1 ? n : 1;
};
/** An empty box in the form arrives as "", which means "no filter". */
const blankToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

const schema = z.object({
  query: z.preprocess((v) => (typeof v === "string" ? v : ""), z.string().trim().max(MAX_SEARCH_LENGTH, "query_too_long")),
  role: z.preprocess(blankToUndefined, z.enum(ACCOUNT_ROLES, { error: "role_invalid" }).optional()),
  order: z.preprocess(blankToUndefined, z.enum(USER_ORDERS, { error: "order_invalid" }).default("created")),
  page: z.preprocess(toPage, z.number()),
});

export interface UserListResult {
  items: UserAccount[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  query: string;
  role: AccountRole | null;
  order: UserOrder;
}

/** One page of accounts for the admin lists (users and leaderboard). */
export async function listUsers(
  deps: { auth: AuthService; roles: RoleReader; users: UserDirectory },
  input: unknown
): Promise<UserListResult> {
  await requireAdmin(deps);
  const { query, role, order, page } = parseOrThrow(schema, input ?? {});
  const { items, total } = await deps.users.list({
    query,
    role: role ?? null,
    order,
    offset: (page - 1) * USERS_PAGE_SIZE,
    limit: USERS_PAGE_SIZE,
  });
  return { items, total, page, pageSize: USERS_PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / USERS_PAGE_SIZE)), query, role: role ?? null, order };
}
