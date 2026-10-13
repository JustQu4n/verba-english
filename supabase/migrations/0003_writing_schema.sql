-- Writing-practice schema: prompts, submissions, evaluations, practice attempts, daily usage.
-- `profiles` already exists (0001/0002), so it is extended here, not recreated.
-- Writes to submissions/evaluations/practice_attempts/user_daily_usage go through the
-- server (service role), so only SELECT policies are granted to end users.

create extension if not exists pgcrypto;

create type public.writing_type as enum ('sentence', 'paragraph');

create type public.submission_status as enum (
  'pending',
  'processing',
  'completed',
  'failed'
);

-- profiles: learning fields (the existing full_name column is kept as the display name)
alter table public.profiles
  add column english_level text not null default 'beginner'
    check (english_level in (
      'beginner', 'elementary', 'intermediate',
      'upper_intermediate', 'advanced'
    )),
  add column learning_goal text;

create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  writing_type public.writing_type not null,
  prompt_text text not null,
  topic text,
  difficulty text not null default 'beginner'
    check (difficulty in ('beginner', 'intermediate', 'advanced')),
  target_word_count int check (target_word_count is null or target_word_count > 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt_id uuid references public.prompts (id) on delete set null,
  writing_type public.writing_type not null,
  prompt_snapshot text not null,
  content text not null,
  word_count int not null check (word_count > 0),
  status public.submission_status not null default 'pending',
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index submissions_user_created_idx
  on public.submissions (user_id, created_at desc);

create trigger submissions_set_updated_at
  before update on public.submissions
  for each row execute function public.set_updated_at();

create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  attempt_number int not null check (attempt_number > 0),
  overall_score numeric(5, 2) not null check (overall_score between 0 and 100),
  result jsonb not null,
  model text not null,
  rubric_version text not null,
  prompt_version text not null,
  input_tokens int,
  output_tokens int,
  latency_ms int,
  created_at timestamptz not null default now(),
  unique (submission_id, attempt_number)
);

create table public.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  content text not null,
  word_count int not null check (word_count > 0),
  created_at timestamptz not null default now()
);

create index practice_attempts_submission_idx
  on public.practice_attempts (submission_id, created_at);

create table public.user_daily_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null default current_date,
  grading_count int not null default 0 check (grading_count >= 0),
  primary key (user_id, usage_date)
);

-- Row level security
alter table public.prompts enable row level security;
alter table public.submissions enable row level security;
alter table public.evaluations enable row level security;
alter table public.practice_attempts enable row level security;
alter table public.user_daily_usage enable row level security;

create policy "Users read published prompts"
  on public.prompts for select
  to authenticated
  using (is_published = true);

create policy "Users read own submissions"
  on public.submissions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read own evaluations"
  on public.evaluations for select
  to authenticated
  using (exists (
    select 1 from public.submissions s
    where s.id = submission_id and s.user_id = (select auth.uid())
  ));

create policy "Users read own practice attempts"
  on public.practice_attempts for select
  to authenticated
  using (exists (
    select 1 from public.submissions s
    where s.id = submission_id and s.user_id = (select auth.uid())
  ));

create policy "Users read own daily usage"
  on public.user_daily_usage for select
  to authenticated
  using ((select auth.uid()) = user_id);
