-- Accepted answers per prompt, so correct answers can be graded without the AI. Run after 0007_points.sql.
-- A separate table (not a column on prompts) because learners can read published prompts:
-- here no policy is given to learners, so they can never read the answers. The server reads with the service role.

create table public.prompt_answers (
  prompt_id uuid primary key references public.prompts (id) on delete cascade,
  -- [{ "text": "...", "structureVi": "...", "structureEn": "..." }], at most 5 (checked by the app)
  answers jsonb not null default '[]'::jsonb check (jsonb_typeof(answers) = 'array'),
  updated_at timestamptz not null default now()
);

create trigger prompt_answers_set_updated_at
  before update on public.prompt_answers
  for each row execute function public.set_updated_at();

alter table public.prompt_answers enable row level security;

revoke all on public.prompt_answers from anon;

create policy "Admins read prompt answers"
  on public.prompt_answers for select
  to authenticated
  using (public.is_admin());

create policy "Admins insert prompt answers"
  on public.prompt_answers for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins update prompt answers"
  on public.prompt_answers for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins delete prompt answers"
  on public.prompt_answers for delete
  to authenticated
  using (public.is_admin());
