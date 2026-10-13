import type { RoleReader } from "@/modules/admin/application/role-reader";
import type { AuthService } from "@/modules/auth/application/auth-service";

import type { PromptRepository } from "./prompt-repository";

/** Dependencies shared by every admin prompt use case. */
export interface PromptAdminDeps {
  auth: AuthService;
  roles: RoleReader;
  prompts: PromptRepository;
}
