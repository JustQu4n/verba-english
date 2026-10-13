/** Where credit balances live. Named by meaning so the storage can change. */
export interface CreditStore {
  /** Balance of a user. 0 when the account has no profile. */
  balance(userId: string): Promise<number>;
  /**
   * Takes `amount` credits from the SIGNED-IN user and returns the new balance,
   * or null when the balance is too low. Atomic: two parallel calls can never overdraw.
   */
  spend(amount: number): Promise<number | null>;
}
