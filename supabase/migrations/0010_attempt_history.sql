-- Every graded attempt: the attempt, what the learner wrote, and how it was graded. Run after 0009.
-- Older unused tables with these names are replaced, but only when they hold no rows.
do $$
declare
  t text;
  n bigint;
begin
  foreach t in array array['evaluations', 'submissions', 'practice_attempts'] loop
    if to_regclass('public.' || t) is not null then
      execute format('select count(*) from public.%I', t) into n;
      if n > 0 then
        raise exception 'public.% already holds % rows; not replacing it', t, n;
      end if;
    end if;
  end loop;
end $$;

drop table if exists public.evaluations cascade;
drop table if exists public.submissions cascade;
drop table if exists public.practice_attempts cascade;

-- 1. One row per graded attempt.
create table public.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt_id uuid not null references public.prompts (id) on delete cascade,
  -- What the learner picked: AI feedback or the accepted answers.
  grading_mode text not null check (grading_mode in ('ai', 'reference')),
  correct boolean not null,
  created_at timestamptz not null default now()
);

create index practice_attempts_user_idx on public.practice_attempts (user_id, created_at desc);
create index practice_attempts_prompt_idx on public.practice_attempts (prompt_id);

-- 2. What the learner wrote.
create table public.submissions (
  attempt_id uuid primary key references public.practice_attempts (id) on delete cascade,
  answer text not null check (char_length(answer) between 1 and 300)
);

-- 3. How it was graded. `source` is who produced the verdict: a correct answer found in the cache or in the
--    accepted answers has a different source from the mode the learner picked.
create table public.evaluations (
  attempt_id uuid primary key references public.practice_attempts (id) on delete cascade,
  source text not null check (source in ('ai', 'reference')),
  language text not null check (language in ('vi', 'en')),
  suggestion text not null default '',
  improvements jsonb not null default '[]'::jsonb,
  comment text not null default ''
);

alter table public.practice_attempts enable row level security;
alter table public.submissions enable row level security;
alter table public.evaluations enable row level security;

create policy "Users read their own attempts"
  on public.practice_attempts for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read their own submissions"
  on public.submissions for select to authenticated
  using (exists (select 1 from public.practice_attempts a where a.id = attempt_id and a.user_id = (select auth.uid())));

create policy "Users read their own evaluations"
  on public.evaluations for select to authenticated
  using (exists (select 1 from public.practice_attempts a where a.id = attempt_id and a.user_id = (select auth.uid())));

-- Read-only for users: rows are written by record_attempt, called from trusted server code.
revoke all on public.practice_attempts, public.submissions, public.evaluations from anon, authenticated;
grant select on public.practice_attempts, public.submissions, public.evaluations to authenticated;

-- 4. Writes the three rows in one transaction. Only the service role may call it.
create or replace function public.record_attempt(
  p_user_id uuid,
  p_prompt_id uuid,
  p_mode text,
  p_correct boolean,
  p_answer text,
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
  insert into public.practice_attempts (user_id, prompt_id, grading_mode, correct)
  values (p_user_id, p_prompt_id, p_mode, p_correct)
  returning id into v_id;

  insert into public.submissions (attempt_id, answer) values (v_id, p_answer);

  insert into public.evaluations (attempt_id, source, language, suggestion, improvements, comment)
  values (v_id, p_source, p_language, coalesce(p_suggestion, ''), coalesce(p_improvements, '[]'::jsonb), coalesce(p_comment, ''));

  return v_id;
end;
$$;

revoke all on function public.record_attempt(uuid, uuid, text, boolean, text, text, text, text, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.record_attempt(uuid, uuid, text, boolean, text, text, text, text, jsonb, text)
  to service_role;

-- Make the API pick up the new tables right away.
notify pgrst, 'reload schema';
