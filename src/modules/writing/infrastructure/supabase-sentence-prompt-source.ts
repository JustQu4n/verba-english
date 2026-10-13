import type { SupabaseClient } from "@supabase/supabase-js";

import { InfrastructureError } from "@/core/errors";

import type { SentencePromptSource } from "../application/sentence-prompt-source";
import { CATEGORIES, type Category, type Level, type SentencePrompt, type SentenceSelection } from "../domain/sentence-catalog";
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

  async countByCategory(level: Level): Promise<Partial<Record<Category, number>>> {
    const { data, error } = await this.client
      .from("prompts")
      .select("category")
      .eq("writing_type", "sentence")
      .eq("is_published", true)
      .eq("difficulty", level)
      .returns<{ category: string | null }[]>();
    if (error) throw new InfrastructureError("Could not count sentence prompts", { cause: error });
    const counts: Partial<Record<Category, number>> = {};
    for (const { category } of data ?? []) {
      const known = CATEGORIES.find((c) => c === category);
      if (known) counts[known] = (counts[known] ?? 0) + 1;
    }
    return counts;
  }

  async get(id: string): Promise<SentencePrompt | null> {
    const { data, error } = await this.client
      .from("prompts")
      .select("id, difficulty, category, prompt_text, hint")
      .eq("id", id)
      .eq("writing_type", "sentence")
      .eq("is_published", true)
      .maybeSingle<PracticeRow>();

    if (error) throw new InfrastructureError("Could not read the sentence prompt", { cause: error });
    if (!data) return null;
    const prompt = toPrompt({ ...data, is_published: true, created_at: "", updated_at: "" });
    return prompt && { id: prompt.id, level: prompt.level, category: prompt.category, vietnamese: prompt.vietnamese, hint: prompt.hint };
  }
}
