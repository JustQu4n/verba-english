-- Per-learner progress counters, so the choose screen reads one small table instead of joining completions with prompts.
-- Run after 0008_accepted_answers.sql.
create table public.sentence_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  difficulty text not null,
  category text not null,
  -- Completed sentences of this level and category that are still published.
  completed integer not null default 0 check (completed >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, difficulty, category)
);

alter table public.sentence_progress enable row level security;

create policy "Users read their own progress"
  on public.sentence_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Read-only for users: counters are written by the functions below, never by the client.
revoke all on public.sentence_progress from anon, authenticated;
grant select on public.sentence_progress to authenticated;

-- Rebuilds every counter from the completions. Used for the backfill below and after an admin changes which
-- prompts are published or where they belong, so the counters never drift from the real data.
create function public.rebuild_sentence_progress()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.sentence_progress;
  insert into public.sentence_progress (user_id, difficulty, category, completed)
  select c.user_id, p.difficulty, p.category, count(*)::integer
  from public.sentence_completions c
  join public.prompts p on p.id = c.prompt_id
  where p.writing_type = 'sentence' and p.is_published and p.difficulty is not null and p.category is not null
  group by c.user_id, p.difficulty, p.category;
end;
$$;

revoke all on function public.rebuild_sentence_progress() from public, anon, authenticated;
grant execute on function public.rebuild_sentence_progress() to service_role;

-- An admin edit that moves, hides or deletes prompts changes what counts. Statement level: runs once, after
-- the cascade that removes the completions of a deleted prompt.
create function public.sentence_progress_after_prompt_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.rebuild_sentence_progress();
  return null;
end;
$$;

create trigger prompts_rebuild_progress_update
  after update of is_published, difficulty, category, writing_type on public.prompts
  for each statement execute function public.sentence_progress_after_prompt_change();

create trigger prompts_rebuild_progress_delete
  after delete on public.prompts
  for each statement execute function public.sentence_progress_after_prompt_change();

-- complete_sentence now also bumps the counter, in the same transaction as the completion.
create or replace function public.complete_sentence(p_user_id uuid, p_prompt_id uuid)
returns table (awarded integer, total_points integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted integer;
  v_difficulty text;
  v_category text;
begin
  select difficulty, category into v_difficulty, v_category
  from public.prompts
  where id = p_prompt_id and is_published and writing_type = 'sentence';
  if not found then
    raise exception 'prompt not available' using errcode = '22023';
  end if;

  insert into public.sentence_completions (user_id, prompt_id)
  values (p_user_id, p_prompt_id)
  on conflict do nothing;
  get diagnostics inserted = row_count;

  if inserted = 1 then
    update public.profiles set points = points + 10 where id = p_user_id;
    if v_difficulty is not null and v_category is not null then
      insert into public.sentence_progress (user_id, difficulty, category, completed)
      values (p_user_id, v_difficulty, v_category, 1)
      on conflict (user_id, difficulty, category)
      do update set completed = public.sentence_progress.completed + 1, updated_at = now();
    end if;
  end if;

  return query
    select (inserted * 10)::integer, p.points from public.profiles p where p.id = p_user_id;
end;
$$;

revoke all on function public.complete_sentence(uuid, uuid) from public, anon, authenticated;
grant execute on function public.complete_sentence(uuid, uuid) to service_role;

-- Backfill from the completions that already exist.
select public.rebuild_sentence_progress();

-- Make the API pick up the new tables right away.
notify pgrst, 'reload schema';
