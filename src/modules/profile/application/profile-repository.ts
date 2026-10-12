import type { Profile } from "@/modules/profile/domain/profile";

export interface ProfileRepository {
  findById(id: string): Promise<Profile | null>;
}
