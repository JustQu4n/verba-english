-- Accent colour chosen by the learner for the dark blocks and solid buttons (a #rrggbb colour).
-- Null = the default black.
alter table public.profiles
  add column accent_color text
  check (accent_color is null or accent_color ~ '^#[0-9a-f]{6}$');

-- Column-level grants (see 0004): a learner may change only the columns listed here.
grant update (accent_color) on public.profiles to authenticated;
