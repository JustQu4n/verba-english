-- Leaderboard ranks are now 1, 2, 3... with no shared places. Run after 0012_leaderboard.sql.
-- Learners with equal points are ordered by who has the older account (then by id), so the order never changes
-- between page loads. Same signatures as before, so this only replaces the function bodies.

create or replace function public.leaderboard_top(p_limit integer)
returns table (user_id uuid, full_name text, avatar_url text, points integer, rank integer)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, p.avatar_url, p.points,
         (row_number() over (order by p.points desc, p.created_at, p.id))::integer
    from public.profiles p
   where p.points > 0
   order by p.points desc, p.created_at, p.id
   limit greatest(least(p_limit, 100), 1);
$$;

create or replace function public.leaderboard_rank(p_user_id uuid)
returns table (points integer, rank integer)
language sql
stable
security definer
set search_path = ''
as $$
  select p.points,
         ((select count(*) from public.profiles q
            where q.points > p.points
               or (q.points = p.points and (q.created_at, q.id) < (p.created_at, p.id))) + 1)::integer
    from public.profiles p
   where p.id = p_user_id and p.points > 0;
$$;

notify pgrst, 'reload schema';
