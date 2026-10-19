import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { InfrastructureError } from "@/core/errors";

import type { GradeCache } from "../application/grade-cache";
import type { SentenceGrade } from "../domain/sentence-grade";

export const GRADE_TTL_MS = 24 * 60 * 60 * 1000;
/** About one write in fifty also deletes expired rows, so the table does not grow forever and no scheduler is needed. */
const PURGE_CHANCE = 0.02;

const gradeSchema = z.object({
  correct: z.boolean(),
  suggestion: z.string(),
  improvements: z.array(z.string()),
  comment: z.string(),
});

/** The key holds the learner's answer, so only a hash of it is stored. */
const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");

/**
 * Grades shared by every server instance, in `grade_cache`. The table has no policy for learners, so a
 * service-role client is created per call; a missing key fails here and the use case grades without the cache.
 */
export class SupabaseGradeCache implements GradeCache {
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
      throw new InfrastructureError("Could not use the grade cache", { cause: error });
    }
  }

  async get(key: string): Promise<SentenceGrade | undefined> {
    const { data, error } = await this.client()
      .from("grade_cache")
      .select("grade")
      .eq("key", hashKey(key))
      .gt("expires_at", new Date(this.now()).toISOString())
      .maybeSingle<{ grade: unknown }>();
    if (error) throw new InfrastructureError("Could not read the grade cache", { cause: error });
    const parsed = gradeSchema.safeParse(data?.grade);
    return parsed.success ? parsed.data : undefined;
  }

  async set(key: string, grade: SentenceGrade): Promise<void> {
    const client = this.client();
    const { error } = await client
      .from("grade_cache")
      .upsert({ key: hashKey(key), grade, expires_at: new Date(this.now() + GRADE_TTL_MS).toISOString() }, { onConflict: "key" });
    if (error) throw new InfrastructureError("Could not write the grade cache", { cause: error });
    if (this.random() < PURGE_CHANCE) {
      // Housekeeping only: a failure here is not worth failing the write that already succeeded.
      await client.from("grade_cache").delete().lt("expires_at", new Date(this.now()).toISOString());
    }
  }
}
