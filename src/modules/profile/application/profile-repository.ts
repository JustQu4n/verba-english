import type { Profile } from "@/modules/profile/domain/profile";

/** What a user may change on their own profile. `undefined` leaves a field as it is. */
export interface ProfilePatch {
  fullName?: string;
  avatarUrl?: string | null;
  accentColor?: string | null;
}

export interface ProfileRepository {
  findById(id: string): Promise<Profile | null>;
  /** Changes the profile of `id` and returns it; throws NotFoundError when there is none. */
  update(id: string, patch: ProfilePatch): Promise<Profile>;
}
