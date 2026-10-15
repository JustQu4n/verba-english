export const ACCOUNT_ROLES = ["user", "admin"] as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[number];

/** How the account list can be sorted: newest first, most points first, or by name. */
export const USER_ORDERS = ["created", "points", "name"] as const;
export type UserOrder = (typeof USER_ORDERS)[number];

export const USERS_PAGE_SIZE = 20;
export const MAX_SEARCH_LENGTH = 100;
/** Generous caps that only exist to stop a typo like an extra zero from becoming a billion. */
export const MAX_CREDITS = 1_000_000;
export const MAX_POINTS = 10_000_000;

/** One account as an admin sees it: the profile plus the sign-in facts that live outside it. */
export interface UserAccount {
  readonly id: string;
  readonly email: string | null;
  readonly fullName: string | null;
  readonly avatarUrl: string | null;
  readonly role: AccountRole;
  readonly points: number;
  readonly credits: number;
  readonly createdAt: Date;
  readonly lastSignInAt: Date | null;
  /** Position on the leaderboard (1 = best); null while the account has no points. */
  readonly rank: number | null;
}

/** The numbers on the overview page. */
export interface AdminOverview {
  readonly users: number;
  readonly admins: number;
  readonly newUsers7d: number;
  readonly rankedLearners: number;
  readonly pointsTotal: number;
  readonly promptsPublished: number;
  readonly promptsDraft: number;
  readonly attempts: number;
  readonly completions: number;
}
