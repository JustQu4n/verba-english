import type { AccountRole, AdminOverview, UserAccount, UserOrder } from "../domain/user-account";

export interface UserFilter {
  /** Matches part of the name or the email, ignoring case. Empty matches everyone. */
  query: string;
  role: AccountRole | null;
  order: UserOrder;
  offset: number;
  limit: number;
}

/** What an admin may change on an account. `undefined` leaves a field as it is. */
export interface UserPatch {
  role?: AccountRole;
  credits?: number;
  points?: number;
}

/** Where the accounts are read and changed by admins. Only trusted server code may use it. */
export interface UserDirectory {
  /** One page of accounts; `total` counts everything the filter matches. */
  list(filter: UserFilter): Promise<{ items: UserAccount[]; total: number }>;
  find(id: string): Promise<UserAccount | null>;
  /** Changes the account and returns it; null when there is no such account. */
  update(id: string, patch: UserPatch): Promise<UserAccount | null>;
  overview(): Promise<AdminOverview>;
}
