-- Leaderboard. Run after 0011_attempt_history_limits.sql.
-- profiles only lets a user read their own row, so the ranking is served by two functions that only the
-- service role may call (the app calls them from trusted server code). They expose name, avatar and points only,
-- never emails.

-- Top of the ranking. Ties share a rank; people with 0 points are not ranked.
create function public.leaderboard_top(p_limit integer)
returns table (user_id uuid, full_name text, avatar_url text, points integer, rank integer)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, p.avatar_url, p.points,
         (rank() over (order by p.points desc))::integer
    from public.profiles p
   where p.points > 0
   order by p.points desc, p.created_at, p.id
   limit greatest(least(p_limit, 100), 1);
$$;

-- Rank and points of one user; no row when they have no points yet.
create function public.leaderboard_rank(p_user_id uuid)
returns table (points integer, rank integer)
language sql
stable
security definer
set search_path = ''
as $$
  select p.points,
         ((select count(*) from public.profiles q where q.points > p.points) + 1)::integer
    from public.profiles p
   where p.id = p_user_id and p.points > 0;
$$;

revoke all on function public.leaderboard_top(integer) from public, anon, authenticated;
revoke all on function public.leaderboard_rank(uuid) from public, anon, authenticated;
grant execute on function public.leaderboard_top(integer) to service_role;
grant execute on function public.leaderboard_rank(uuid) to service_role;

notify pgrst, 'reload schema';
