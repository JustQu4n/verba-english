-- Admin console: read functions for the user list, the full leaderboard and the overview numbers. Run after 0016.
-- They join auth.users (email, last sign-in), which no user session can read, so they are security definer and only the
-- service role may call them. The app calls them from trusted server code after checking the caller is an admin.

-- 1. A page of accounts. `rank` is the leaderboard position over ALL accounts (same order as leaderboard_top:
--    points, then older account, then id); accounts without points have no rank. `total_count` is the size of the
--    filtered list, so one call serves both the page and the pagination.
create or replace function public.admin_list_users(
  p_query text default null,
  p_role text default null,
  p_order text default 'created',
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  user_id uuid, email text, full_name text, avatar_url text, role text, points integer, credits integer,
  created_at timestamptz, last_sign_in_at timestamptz, rank integer, total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with ranked as (
    select q.id, (row_number() over (order by q.points desc, q.created_at, q.id))::integer as rank
      from public.profiles q
     where q.points > 0
  ),
  matching as (
    select p.id, u.email::text as email, p.full_name, p.avatar_url, p.role, p.points, p.credits,
           p.created_at, u.last_sign_in_at, r.rank
      from public.profiles p
      join auth.users u on u.id = p.id
      left join ranked r on r.id = p.id
     where (p_role is null or p.role = p_role)
       and (
         nullif(trim(p_query), '') is null
         or p.full_name ilike '%' || replace(replace(replace(trim(p_query), '\', '\\'), '%', '\%'), '_', '\_') || '%'
         or u.email ilike '%' || replace(replace(replace(trim(p_query), '\', '\\'), '%', '\%'), '_', '\_') || '%'
       )
  )
  select m.id, m.email, m.full_name, m.avatar_url, m.role, m.points, m.credits, m.created_at, m.last_sign_in_at, m.rank,
         count(*) over ()
    from matching m
   order by
     (case when p_order = 'points' then m.points end) desc nulls last,
     (case when p_order = 'name' then lower(coalesce(nullif(m.full_name, ''), m.email)) end) asc nulls last,
     (case when p_order = 'points' then m.created_at end) asc nulls last,
     m.created_at desc,
     m.id
   limit greatest(least(p_limit, 100), 1)
  offset greatest(p_offset, 0);
$$;

-- 2. One account, same columns (total_count is 1).
create or replace function public.admin_get_user(p_user_id uuid)
returns table (
  user_id uuid, email text, full_name text, avatar_url text, role text, points integer, credits integer,
  created_at timestamptz, last_sign_in_at timestamptz, rank integer, total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, u.email::text, p.full_name, p.avatar_url, p.role, p.points, p.credits, p.created_at, u.last_sign_in_at,
         case when p.points > 0 then
           ((select count(*) from public.profiles q
              where q.points > p.points
                 or (q.points = p.points and (q.created_at, q.id) < (p.created_at, p.id))) + 1)::integer
         end,
         1::bigint
    from public.profiles p
    join auth.users u on u.id = p.id
   where p.id = p_user_id;
$$;

-- 3. Numbers for the overview page, in one round trip.
create or replace function public.admin_overview()
returns table (
  users bigint, admins bigint, new_users_7d bigint, ranked_learners bigint, points_total bigint,
  prompts_published bigint, prompts_draft bigint, attempts bigint, completions bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*) from public.profiles),
    (select count(*) from public.profiles where role = 'admin'),
    (select count(*) from public.profiles where created_at >= now() - interval '7 days'),
    (select count(*) from public.profiles where points > 0),
    (select coalesce(sum(points), 0) from public.profiles),
    (select count(*) from public.prompts where is_published),
    (select count(*) from public.prompts where not is_published),
    (select count(*) from public.practice_attempts),
    (select count(*) from public.sentence_completions);
$$;

revoke all on function public.admin_list_users(text, text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.admin_get_user(uuid) from public, anon, authenticated;
revoke all on function public.admin_overview() from public, anon, authenticated;
grant execute on function public.admin_list_users(text, text, text, integer, integer) to service_role;
grant execute on function public.admin_get_user(uuid) to service_role;
grant execute on function public.admin_overview() to service_role;

notify pgrst, 'reload schema';
