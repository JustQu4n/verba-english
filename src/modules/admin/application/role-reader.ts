/** Answers whether an account has admin rights. Named by meaning, not by where the role is stored. */
export interface RoleReader {
  isAdmin(userId: string): Promise<boolean>;
}
