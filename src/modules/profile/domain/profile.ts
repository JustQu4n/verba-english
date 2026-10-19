export interface Profile {
  readonly id: string;
  readonly fullName: string | null;
  readonly avatarUrl: string | null;
  /** Accent colour of dark blocks and solid buttons (#rrggbb); null = the default black. */
  readonly accentColor: string | null;
  readonly createdAt: Date;
}
