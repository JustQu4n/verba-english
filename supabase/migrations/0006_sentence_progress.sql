-- Which sentences each learner has completed (answered correctly). Run after 0005_credits.sql.
create table public.sentence_completions (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Deleting a prompt (admin) removes its completions with it.
  prompt_id uuid not null references public.prompts (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, prompt_id)
);

alter table public.sentence_completions enable row level security;

create policy "Users read their own completions"
  on public.sentence_completions for select
  to authenticated
  using (user_id = (select auth.uid()));

-- A learner can only record a completion for themselves, and only for a prompt they are allowed to see (published).
create policy "Users record their own completions"
  on public.sentence_completions for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.prompts p where p.id = prompt_id and p.is_published)
  );

-- No update or delete from a user session: history only grows.
revoke all on public.sentence_completions from anon, authenticated;
grant select, insert on public.sentence_completions to authenticated;

-- Progress lookups join prompts by id; the primary key already serves "this user's completions".
create index sentence_completions_prompt_idx on public.sentence_completions (prompt_id);
