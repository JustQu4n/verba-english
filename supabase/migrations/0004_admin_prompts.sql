-- Admin role, admin-only prompt writes, and the extra columns sentence prompts need.
-- Run after 0003_writing_schema.sql.

-- 1. Role on profiles. New accounts are always 'user'; admins are promoted by hand (see docs/admin-setup.md).
alter table public.profiles
  add column role text not null default 'user' check (role in ('user', 'admin'));

-- 2. A user must never be able to change their own role. RLS lets users update their own row,
--    so restrict WHICH COLUMNS they may write. The signup trigger is security definer and unaffected.
revoke insert, update on public.profiles from anon, authenticated;
grant insert (id, full_name, avatar_url), update (full_name, avatar_url)
  on public.profiles to authenticated;

-- 3. Admin check usable from policies. security definer so it can read profiles regardless of the caller's RLS.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 4. Sentence prompts: category and key-word hint, plus an updated_at stamp.
alter table public.prompts
  add column category text check (category is null or category in (
    'personal-communication', 'everyday-life', 'transportation-travel', 'school-education',
    'work-business', 'public-services', 'health-medicine', 'shopping-money',
    'food-drink', 'entertainment-leisure', 'nature-environment', 'science-technology',
    'culture-society', 'government-politics', 'history-geography', 'sports-fitness',
    'arts-literature', 'religion-spirituality', 'law-justice', 'philosophy-ethics'
  )),
  add column hint text,
  add column updated_at timestamptz not null default now();

create trigger prompts_set_updated_at
  before update on public.prompts
  for each row execute function public.set_updated_at();

-- Practice lookups: published sentence prompts by level and category.
create index prompts_practice_idx
  on public.prompts (writing_type, difficulty, category)
  where is_published;

-- 5. Only admins read drafts and write prompts. Learners keep reading published ones (policy from 0003).
create policy "Admins read all prompts"
  on public.prompts for select
  to authenticated
  using (public.is_admin());

create policy "Admins insert prompts"
  on public.prompts for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins update prompts"
  on public.prompts for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins delete prompts"
  on public.prompts for delete
  to authenticated
  using (public.is_admin());
