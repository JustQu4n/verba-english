import type { SupabaseClient } from "@supabase/supabase-js";

import { InfrastructureError } from "@/core/errors";

import type { SavedWordStore } from "../application/ports";
import { parseEntry, type DictionaryEntry, type SavedWord } from "../domain/dictionary-entry";

/** `saved_words` through the user's own session: row level security keeps each learner to their own rows. */
export class SupabaseSavedWordStore implements SavedWordStore {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async list(userId: string): Promise<SavedWord[]> {
    const { data, error } = await this.client
      .from("saved_words")
      .select("entry, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .returns<{ entry: unknown; created_at: string }[]>();
    if (error) throw new InfrastructureError("Could not read the saved words", { cause: error });
    return (data ?? []).flatMap((row) => {
      const entry = parseEntry(row.entry);
      return entry ? [{ entry, savedAt: new Date(row.created_at) }] : [];
    });
  }

  async has(userId: string, word: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("saved_words")
      .select("id")
      .eq("user_id", userId)
      .eq("word", word)
      .maybeSingle<{ id: string }>();
    if (error) throw new InfrastructureError("Could not read the saved words", { cause: error });
    return data !== null;
  }

  async save(userId: string, entry: DictionaryEntry): Promise<void> {
    const { error } = await this.client
      .from("saved_words")
      .upsert({ user_id: userId, word: entry.word, entry }, { onConflict: "user_id,word" });
    if (error) throw new InfrastructureError("Could not save the word", { cause: error });
  }

  async remove(userId: string, word: string): Promise<void> {
    const { error } = await this.client.from("saved_words").delete().eq("user_id", userId).eq("word", word);
    if (error) throw new InfrastructureError("Could not remove the word", { cause: error });
  }
}
