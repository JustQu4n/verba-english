-- Dictionary: a server-side cache of lookups and the words each learner saves. Run after 0017.

-- 1. Cache of normalized dictionary entries. Only trusted server code (service role) reads or writes it:
--    RLS is on and there is no policy, so the anon and signed-in roles see nothing.
create table if not exists public.dictionary_cache (
  word text primary key,
  entry jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.dictionary_cache enable row level security;

-- 2. Words a learner saved. `entry` is a snapshot of what the learner saw, so the list still works if the cache is cleared.
create table if not exists public.saved_words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  word text not null check (char_length(word) between 1 and 60),
  entry jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, word)
);
create index if not exists saved_words_user_created_idx on public.saved_words (user_id, created_at desc);
alter table public.saved_words enable row level security;

drop policy if exists "saved_words_select_own" on public.saved_words;
create policy "saved_words_select_own" on public.saved_words
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "saved_words_insert_own" on public.saved_words;
create policy "saved_words_insert_own" on public.saved_words
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "saved_words_update_own" on public.saved_words;
create policy "saved_words_update_own" on public.saved_words
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "saved_words_delete_own" on public.saved_words;
create policy "saved_words_delete_own" on public.saved_words
  for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.saved_words to authenticated;
revoke all on public.dictionary_cache from anon, authenticated;
