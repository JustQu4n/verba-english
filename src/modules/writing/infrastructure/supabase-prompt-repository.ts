import type { SupabaseClient } from "@supabase/supabase-js";

import { InfrastructureError } from "@/core/errors";

import type { PromptFilter, PromptPage, PromptRepository } from "../application/prompt-repository";
import type { Prompt, PromptDraft } from "../domain/prompt";
import { PROMPT_COLUMNS, type PromptRow, toPrompt } from "./prompt-rows";

const SENTENCE = "sentence";
const TITLE_LENGTH = 80;
/** PostgREST answers a page past the end with this code. */
const RANGE_NOT_SATISFIABLE = "PGRST103";

/** Escapes LIKE wildcards so a search for "100%" matches the text, not everything. */
const escapeLike = (text: string) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

const toColumns = (draft: PromptDraft) => ({
  // `title` is required by the table; sentence prompts have no separate title, so derive one.
  title: draft.vietnamese.slice(0, TITLE_LENGTH),
  prompt_text: draft.vietnamese,
  hint: draft.hint,
  difficulty: draft.level,
  category: draft.category,
  is_published: draft.published,
});

/** Admin-side access to sentence prompts. Runs as the signed-in admin, so row level security decides what is allowed. */
export class SupabasePromptRepository implements PromptRepository {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async list(filter: PromptFilter): Promise<PromptPage> {
    let query = this.client
      .from("prompts")
      .select(PROMPT_COLUMNS, { count: "exact" })
      .eq("writing_type", SENTENCE);
    if (filter.level) query = query.eq("difficulty", filter.level);
    if (filter.category) query = query.eq("category", filter.category);
    if (filter.status !== "all") query = query.eq("is_published", filter.status === "published");
    if (filter.query) query = query.ilike("prompt_text", `%${escapeLike(filter.query)}%`);

    const from = (filter.page - 1) * filter.pageSize;
    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, from + filter.pageSize - 1)
      .returns<PromptRow[]>();

    if (error?.code === RANGE_NOT_SATISFIABLE) return { items: [], total: 0 };
    if (error) throw new InfrastructureError("Could not list prompts", { cause: error });

    const items = (data ?? []).map(toPrompt).filter((p): p is Prompt => p !== null);
    return { items, total: count ?? items.length };
  }

  async findById(id: string): Promise<Prompt | null> {
    const { data, error } = await this.client
      .from("prompts")
      .select(PROMPT_COLUMNS)
      .eq("id", id)
      .eq("writing_type", SENTENCE)
      .maybeSingle<PromptRow>();
    if (error) throw new InfrastructureError("Could not read prompt", { cause: error });
    return data ? toPrompt(data) : null;
  }

  /** Replaces the accepted answers of a prompt. Stored apart from the prompt so learners can never read them. */
  private async saveAnswers(promptId: string, draft: PromptDraft): Promise<void> {
    const { error } = await this.client
      .from("prompt_answers")
      .upsert({ prompt_id: promptId, answers: draft.answers }, { onConflict: "prompt_id" });
    if (error) throw new InfrastructureError("Could not save the accepted answers", { cause: error });
  }

  async create(draft: PromptDraft): Promise<Prompt> {
    const { data, error } = await this.client
      .from("prompts")
      .insert({ ...toColumns(draft), writing_type: SENTENCE })
      .select(PROMPT_COLUMNS)
      .single<PromptRow>();
    const prompt = data ? toPrompt(data) : null;
    if (error || !prompt) throw new InfrastructureError("Could not create prompt", { cause: error });
    await this.saveAnswers(prompt.id, draft);
    return { ...prompt, answers: draft.answers };
  }

  async update(id: string, draft: PromptDraft): Promise<Prompt | null> {
    const { data, error } = await this.client
      .from("prompts")
      .update(toColumns(draft))
      .eq("id", id)
      .eq("writing_type", SENTENCE)
      .select(PROMPT_COLUMNS)
      .maybeSingle<PromptRow>();
    if (error) throw new InfrastructureError("Could not update prompt", { cause: error });
    const prompt = data ? toPrompt(data) : null;
    if (!prompt) return null;
    await this.saveAnswers(prompt.id, draft);
    return { ...prompt, answers: draft.answers };
  }

  async remove(id: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("prompts")
      .delete()
      .eq("id", id)
      .eq("writing_type", SENTENCE)
      .select("id");
    if (error) throw new InfrastructureError("Could not delete prompt", { cause: error });
    return (data?.length ?? 0) > 0;
  }
}
