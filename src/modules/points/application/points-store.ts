/** Where learners' points live. */
export interface PointsStore {
  /** Total points of a user. 0 when the account has no profile. */
  total(userId: string): Promise<number>;
}
