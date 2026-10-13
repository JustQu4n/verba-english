import type { SupabaseClient } from "@supabase/supabase-js";

import { InfrastructureError } from "@/core/errors";

import type { CompletionResult, SentenceProgressStore } from "../application/sentence-progress-store";
import type { SentenceSelection } from "../domain/sentence-catalog";

/**
 * Completions live in `sentence_completions`. Reads use the user's session (row level security keeps each user to
 * their own rows). Writes go through the database function complete_sentence with a privileged client that is
 * created only when a write happens: users cannot write completions or points themselves.
 */
interface CompletionRow {
  awarded: number;
  total_points: number;
}

export class SupabaseSentenceProgressStore implements SentenceProgressStore {
  private readonly client: SupabaseClient;
  private readonly createWriter: () => SupabaseClient;

  constructor(client: SupabaseClient, createWriter: () => SupabaseClient) {
    this.client = client;
    this.createWriter = createWriter;
  }

  async completedIds(userId: string, { level, category }: SentenceSelection): Promise<Set<string>> {
    // The inner join keeps only completions of prompts that are still published sentences of this pair.
    const { data, error } = await this.client
      .from("sentence_completions")
      .select("prompt_id, prompts!inner(id)")
      .eq("user_id", userId)
      .eq("prompts.writing_type", "sentence")
      .eq("prompts.is_published", true)
      .eq("prompts.difficulty", level)
      .eq("prompts.category", category)
      .returns<{ prompt_id: string }[]>();
    if (error) throw new InfrastructureError("Could not read completed sentences", { cause: error });
    return new Set((data ?? []).map((row) => row.prompt_id));
  }

  async markCompleted(userId: string, promptId: string): Promise<CompletionResult> {
    let writer: SupabaseClient;
    try {
      writer = this.createWriter();
    } catch (error) {
      throw new InfrastructureError("Could not record the completed sentence", { cause: error });
    }
    const { data, error } = await writer.rpc("complete_sentence", { p_user_id: userId, p_prompt_id: promptId });
    const row = (data as CompletionRow[] | null)?.[0];
    if (error || !row) throw new InfrastructureError("Could not record the completed sentence", { cause: error });
    return { awarded: row.awarded, totalPoints: row.total_points };
  }
}
