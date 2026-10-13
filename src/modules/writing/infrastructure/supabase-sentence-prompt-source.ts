import type { SupabaseClient } from "@supabase/supabase-js";

import { InfrastructureError } from "@/core/errors";

import type { SentencePromptSource } from "../application/sentence-prompt-source";
import type { SentencePrompt, SentenceSelection } from "../domain/sentence-catalog";
import type { PromptRow } from "./prompt-rows";
import { toPrompt } from "./prompt-rows";

type PracticeRow = Pick<PromptRow, "id" | "difficulty" | "category" | "prompt_text" | "hint">;

/** Practice-side source: only published sentence prompts of the chosen level and category. */
export class SupabaseSentencePromptSource implements SentencePromptSource {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async list({ level, category }: SentenceSelection): Promise<SentencePrompt[]> {
    const { data, error } = await this.client
      .from("prompts")
      .select("id, difficulty, category, prompt_text, hint")
      .eq("writing_type", "sentence")
      .eq("is_published", true)
      .eq("difficulty", level)
      .eq("category", category)
      .returns<PracticeRow[]>();

    if (error) throw new InfrastructureError("Could not read sentence prompts", { cause: error });

    return (data ?? [])
      .map((row) => toPrompt({ ...row, is_published: true, created_at: "", updated_at: "" }))
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .map(({ id, level: l, category: c, vietnamese, hint }) => ({ id, level: l, category: c, vietnamese, hint }));
  }
}
