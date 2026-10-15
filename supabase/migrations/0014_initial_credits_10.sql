-- New accounts start with 10 free AI-grading credits instead of 100. Run after 0013.
-- Only the default changes: balances of existing accounts are left as they are.
alter table public.profiles alter column credits set default 10;

notify pgrst, 'reload schema';
