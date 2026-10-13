-- Points for completed sentences (for a leaderboard later). Run after 0006_sentence_progress.sql.

-- 1. Points on the profile. Users cannot write this column (0004 allows only full_name and avatar_url).
alter table public.profiles
  add column points integer not null default 0 check (points >= 0);

-- Learners who already completed sentences get 10 points each (must match POINTS_PER_SENTENCE in the app).
update public.profiles p
   set points = 10 * c.completed
  from (select user_id, count(*)::integer as completed from public.sentence_completions group by user_id) c
 where p.id = c.user_id;

-- Leaderboard queries sort by points.
create index profiles_points_idx on public.profiles (points desc);

-- 2. Completions are now written ONLY by the server (service role) through complete_sentence, never by a user session.
--    Otherwise anyone could call the API directly and claim points without answering.
drop policy "Users record their own completions" on public.sentence_completions;
revoke insert on public.sentence_completions from authenticated;

-- 3. Record a completion and award 10 points the first time. Returns how many points were awarded (0 when the
--    sentence was already completed) and the new total. Only the service role may call it.
create function public.complete_sentence(p_user_id uuid, p_prompt_id uuid)
returns table (awarded integer, total_points integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted integer;
begin
  if not exists (
    select 1 from public.prompts
    where id = p_prompt_id and is_published and writing_type = 'sentence'
  ) then
    raise exception 'prompt not available' using errcode = '22023';
  end if;

  insert into public.sentence_completions (user_id, prompt_id)
  values (p_user_id, p_prompt_id)
  on conflict do nothing;
  get diagnostics inserted = row_count;

  if inserted = 1 then
    update public.profiles set points = points + 10 where id = p_user_id;
  end if;

  return query
    select (inserted * 10)::integer, p.points from public.profiles p where p.id = p_user_id;
end;
$$;

revoke all on function public.complete_sentence(uuid, uuid) from public, anon, authenticated;
grant execute on function public.complete_sentence(uuid, uuid) to service_role;
