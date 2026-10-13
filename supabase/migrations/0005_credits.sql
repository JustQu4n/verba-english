-- Credits for AI grading: every account starts with 100 free credits. Run after 0004_admin_prompts.sql.

-- 1. Balance on the profile. Existing accounts get the default too. A balance can never go negative.
alter table public.profiles
  add column credits integer not null default 100 check (credits >= 0);

-- Users may only write full_name and avatar_url (see 0004), so `credits` cannot be edited from a user session.
-- It only changes through spend_credits below, or by hand in the dashboard (e.g. after a purchase later).

-- 2. Spend credits for the signed-in user. Returns the new balance, or null when there are not enough.
--    security definer so it can write the column users have no UPDATE right on; it only ever touches auth.uid()'s row
--    and only ever subtracts, so a caller can burn their own credits but never add any.
create function public.spend_credits(amount integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_balance integer;
begin
  if amount is null or amount < 1 or amount > 100 then
    raise exception 'invalid amount' using errcode = '22023';
  end if;

  update public.profiles
     set credits = credits - amount
   where id = (select auth.uid()) and credits >= amount
  returning credits into new_balance;

  return new_balance; -- null when no row matched (not enough credits or no profile)
end;
$$;

revoke all on function public.spend_credits(integer) from public, anon;
grant execute on function public.spend_credits(integer) to authenticated;
