export interface Profile {
  readonly id: string;
  readonly fullName: string | null;
  readonly avatarUrl: string | null;
  readonly createdAt: Date;
}
