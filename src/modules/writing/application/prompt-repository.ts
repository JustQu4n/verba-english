import type { Category, Level } from "../domain/sentence-catalog";
import type { Prompt, PromptDraft } from "../domain/prompt";

export type PromptStatus = "all" | "published" | "draft";

export interface PromptFilter {
  readonly level?: Level;
  readonly category?: Category;
  readonly status: PromptStatus;
  readonly query?: string;
  readonly page: number;
  readonly pageSize: number;
}

export interface PromptPage {
  readonly items: Prompt[];
  readonly total: number;
}

/** Storage for sentence prompts as the admin sees them (drafts included). */
export interface PromptRepository {
  list(filter: PromptFilter): Promise<PromptPage>;
  findById(id: string): Promise<Prompt | null>;
  create(draft: PromptDraft): Promise<Prompt>;
  /** Returns null when no such prompt exists. */
  update(id: string, draft: PromptDraft): Promise<Prompt | null>;
  /** Returns whether a prompt was deleted. */
  remove(id: string): Promise<boolean>;
}
