-- Keeps the attempt history small: only correct answers are kept, repeating the same answer to a sentence updates one row instead of adding
-- another, and only the newest 5 different correct answers per learner and sentence are kept. Run after 0010.
-- Only correct answers are kept from now on; drop the wrong ones saved by 0010 (their answers and grades go with them).
delete from public.practice_attempts where not correct;

alter table public.practice_attempts
  add column answer_key text,
  add column tries integer not null default 1 check (tries >= 1);

-- Rows written before this migration are all kept as they are: each gets a key of its own.
update public.practice_attempts set answer_key = id::text where answer_key is null;
alter table public.practice_attempts alter column answer_key set not null;

-- The same answer (ignoring case, punctuation and spacing) to the same sentence is one row per learner.
create unique index practice_attempts_answer_key_idx on public.practice_attempts (user_id, prompt_id, answer_key);

drop function if exists public.record_attempt(uuid, uuid, text, boolean, text, text, text, text, jsonb, text);

create function public.record_attempt(
  p_user_id uuid,
  p_prompt_id uuid,
  p_mode text,
  p_correct boolean,
  p_answer text,
  p_answer_key text,
  p_source text,
  p_language text,
  p_suggestion text,
  p_improvements jsonb,
  p_comment text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  -- A repeat of the same answer moves the existing row to "now", counts the try and keeps the latest verdict.
  insert into public.practice_attempts (user_id, prompt_id, grading_mode, correct, answer_key)
  values (p_user_id, p_prompt_id, p_mode, p_correct, p_answer_key)
  on conflict (user_id, prompt_id, answer_key) do update
    set grading_mode = excluded.grading_mode,
        correct = excluded.correct,
        tries = public.practice_attempts.tries + 1,
        created_at = now()
  returning id into v_id;

  insert into public.submissions (attempt_id, answer) values (v_id, p_answer)
  on conflict (attempt_id) do update set answer = excluded.answer;

  insert into public.evaluations (attempt_id, source, language, suggestion, improvements, comment)
  values (v_id, p_source, p_language, coalesce(p_suggestion, ''), coalesce(p_improvements, '[]'::jsonb), coalesce(p_comment, ''))
  on conflict (attempt_id) do update
    set source = excluded.source,
        language = excluded.language,
        suggestion = excluded.suggestion,
        improvements = excluded.improvements,
        comment = excluded.comment;

  -- Only the 5 newest different answers per sentence stay; the rest go with their answer and grade (cascade).
  delete from public.practice_attempts
  where id in (
    select id from public.practice_attempts
    where user_id = p_user_id and prompt_id = p_prompt_id
    order by created_at desc, id
    offset 5
  );

  return v_id;
end;
$$;

revoke all on function public.record_attempt(uuid, uuid, text, boolean, text, text, text, text, text, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.record_attempt(uuid, uuid, text, boolean, text, text, text, text, text, jsonb, text)
  to service_role;

notify pgrst, 'reload schema';
