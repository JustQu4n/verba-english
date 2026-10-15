import type { SupabaseClient } from "@supabase/supabase-js";

import { InfrastructureError } from "@/core/errors";

import type { AttemptStore } from "../application/attempt-store";
import type { AttemptRecord, GradeSource, NewAttempt } from "../domain/attempt";
import { GRADING_MODES, type GradingMode } from "../domain/grading-mode";

/**
 * Attempts live in `practice_attempts`, with the learner's text in `submissions` and the grade in `evaluations`.
 * Reads use the user's session (row level security keeps each user to their own rows). Writes go through the
 * database function record_attempt with a privileged client that is created only when a write happens.
 */
const COLUMNS =
  "id, grading_mode, correct, tries, created_at, prompts(prompt_text), submissions(answer), evaluations(source, suggestion, improvements, comment)";

type Embedded<T> = T | T[] | null;

interface AttemptRow {
  id: string;
  grading_mode: string;
  correct: boolean;
  tries: number;
  created_at: string;
  prompts: Embedded<{ prompt_text: string }>;
  submissions: Embedded<{ answer: string }>;
  evaluations: Embedded<{ source: string; suggestion: string; improvements: unknown; comment: string }>;
}

/** A one-to-one embed comes back as an object, or as a one-item list depending on the schema cache. */
function one<T>(value: Embedded<T> | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

const text = (value: unknown) => (typeof value === "string" ? value : "");

/** Keeps only string notes: a damaged value must not break the whole page. */
function notes(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toRecord(row: AttemptRow): AttemptRecord {
  const evaluation = one(row.evaluations);
  const mode: GradingMode = GRADING_MODES.find((m) => m === row.grading_mode) ?? "ai";
  const source: GradeSource = evaluation?.source === "reference" ? "reference" : "ai";
  return {
    id: row.id,
    vietnamese: one(row.prompts)?.prompt_text ?? null,
    mode,
    correct: row.correct,
    tries: typeof row.tries === "number" && row.tries >= 1 ? row.tries : 1,
    answer: text(one(row.submissions)?.answer),
    source,
    suggestion: text(evaluation?.suggestion),
    improvements: notes(evaluation?.improvements),
    comment: text(evaluation?.comment),
    createdAt: new Date(row.created_at),
  };
}

export class SupabaseAttemptStore implements AttemptStore {
  private readonly client: SupabaseClient;
  private readonly createWriter: () => SupabaseClient;

  constructor(client: SupabaseClient, createWriter: () => SupabaseClient) {
    this.client = client;
    this.createWriter = createWriter;
  }

  async record(attempt: NewAttempt): Promise<void> {
    let writer: SupabaseClient;
    try {
      writer = this.createWriter();
    } catch (error) {
      throw new InfrastructureError("Could not save the attempt", { cause: error });
    }
    const { error } = await writer.rpc("record_attempt", {
      p_user_id: attempt.userId,
      p_prompt_id: attempt.promptId,
      p_mode: attempt.mode,
      p_correct: attempt.correct,
      p_answer: attempt.answer,
      p_answer_key: attempt.answerKey,
      p_source: attempt.source,
      p_language: attempt.language,
      p_suggestion: attempt.suggestion,
      p_improvements: attempt.improvements,
      p_comment: attempt.comment,
    });
    if (error) throw new InfrastructureError("Could not save the attempt", { cause: error });
  }

  async list(userId: string, { offset, limit }: { offset: number; limit: number }) {
    const { data, error, count } = await this.client
      .from("practice_attempts")
      .select(COLUMNS, { count: "exact" })
      .eq("user_id", userId)
      .eq("correct", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)
      .returns<AttemptRow[]>();
    if (error) throw new InfrastructureError("Could not read the attempts", { cause: error });
    return { items: (data ?? []).map(toRecord), total: count ?? 0 };
  }
}
