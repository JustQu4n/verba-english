-- Shared caches: AI grades and "word not found" answers of the dictionary. Run after 0018.
-- Both tables are read and written only by trusted server code (service role): RLS is on and there is no policy.

-- 1. Grades of the AI, shared by every server instance. `key` is a SHA-256 of language, prompt and answer, so the
--    learner's text is never stored here; `grade` holds only the verdict (suggestion, notes, comment).
create table if not exists public.grade_cache (
  key text primary key,
  grade jsonb not null,
  expires_at timestamptz not null
);
create index if not exists grade_cache_expires_idx on public.grade_cache (expires_at);
alter table public.grade_cache enable row level security;
revoke all on public.grade_cache from anon, authenticated;

-- 2. A word the dictionary does not know is cached with a null entry (kept for a short time, see the app).
alter table public.dictionary_cache alter column entry drop not null;
create index if not exists dictionary_cache_fetched_idx on public.dictionary_cache (fetched_at);
