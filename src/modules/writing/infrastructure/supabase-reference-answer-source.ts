import type { SupabaseClient } from "@supabase/supabase-js";

import { InfrastructureError } from "@/core/errors";

import type { ReferenceAnswerSource } from "../application/reference-answer-source";
import type { AcceptedAnswer } from "../domain/accepted-answer";
import { parseAnswers } from "./prompt-rows";

/**
 * Reads accepted answers with a service-role client: learners have no access to `prompt_answers`
 * (that is the point), so only trusted server code may read it. The client is created per call so a
 * missing key fails here, where the grading use case can fall back to the AI.
 */
export class SupabaseReferenceAnswerSource implements ReferenceAnswerSource {
  private readonly createReader: () => SupabaseClient;

  constructor(createReader: () => SupabaseClient) {
    this.createReader = createReader;
  }

  async find(promptId: string): Promise<AcceptedAnswer[]> {
    let reader: SupabaseClient;
    try {
      reader = this.createReader();
    } catch (error) {
      throw new InfrastructureError("Could not read the accepted answers", { cause: error });
    }
    const { data, error } = await reader
      .from("prompt_answers")
      .select("answers")
      .eq("prompt_id", promptId)
      .maybeSingle<{ answers: unknown }>();
    if (error) throw new InfrastructureError("Could not read the accepted answers", { cause: error });
    return parseAnswers(data?.answers);
  }
}
