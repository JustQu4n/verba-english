import type { SupabaseClient } from "@supabase/supabase-js";

import { InfrastructureError } from "@/core/errors";

import type { CachedLookup, DictionaryCache } from "../application/ports";
import { parseEntry, type DictionaryEntry } from "../domain/dictionary-entry";

export const CACHE_DAYS = 30;
/** A word the dictionary does not know is asked for again after this long: the dictionary may add it. */
export const MISSING_MINUTES = 60;
/** About one write in fifty also deletes expired rows, so the table does not grow forever and no scheduler is needed. */
const PURGE_CHANCE = 0.02;

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

/**
 * `dictionary_cache` has no policy for learners, so it is read and written with a service-role client created per
 * call (a missing key fails here, where the lookup falls back to the dictionary service).
 */
export class SupabaseDictionaryCache implements DictionaryCache {
  private readonly createClient: () => SupabaseClient;
  private readonly now: () => number;
  private readonly random: () => number;

  constructor(createClient: () => SupabaseClient, now: () => number = Date.now, random: () => number = Math.random) {
    this.createClient = createClient;
    this.now = now;
    this.random = random;
  }

  private client(): SupabaseClient {
    try {
      return this.createClient();
    } catch (error) {
      throw new InfrastructureError("Could not use the dictionary cache", { cause: error });
    }
  }

  async get(word: string): Promise<CachedLookup | undefined> {
    const { data, error } = await this.client()
      .from("dictionary_cache")
      .select("entry, fetched_at")
      .eq("word", word)
      .maybeSingle<{ entry: unknown; fetched_at: string }>();
    if (error) throw new InfrastructureError("Could not read the dictionary cache", { cause: error });
    if (!data) return undefined;
    const age = this.now() - new Date(data.fetched_at).getTime();
    if (data.entry === null) return age < MISSING_MINUTES * MINUTE_MS ? { entry: null } : undefined;
    if (!(age < CACHE_DAYS * DAY_MS)) return undefined;
    const entry = parseEntry(data.entry);
    return entry ? { entry } : undefined;
  }

  async put(word: string, entry: DictionaryEntry | null): Promise<void> {
    const client = this.client();
    const { error } = await client
      .from("dictionary_cache")
      .upsert({ word, entry, fetched_at: new Date(this.now()).toISOString() }, { onConflict: "word" });
    if (error) throw new InfrastructureError("Could not write the dictionary cache", { cause: error });
    if (this.random() < PURGE_CHANCE) {
      const found = new Date(this.now() - CACHE_DAYS * DAY_MS).toISOString();
      const missing = new Date(this.now() - MISSING_MINUTES * MINUTE_MS).toISOString();
      // Housekeeping only: a failure here is not worth failing the write that already succeeded.
      await client.from("dictionary_cache").delete().or(`fetched_at.lt.${found},and(entry.is.null,fetched_at.lt.${missing})`);
    }
  }
}
