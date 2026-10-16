-- Every account gets a default profile picture; the user can replace it later (profile page).
-- Run after 0015.
--
-- The default is a generated, deterministic identicon (black and white, like the rest of the app) that depends only on
-- the user id: no name or email is sent to the image service. Keep this in step with defaultAvatarUrl() in
-- src/modules/profile/domain/avatar.ts.

create or replace function public.default_avatar_url(uid uuid)
returns text
language sql
immutable
set search_path = ''
as $$
  select 'https://api.dicebear.com/9.x/identicon/svg?seed=' || uid::text || '&backgroundColor=000000&rowColor=ffffff';
$$;

-- New accounts: the Google photo when there is one, otherwise the default picture.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
      nullif(new.raw_user_meta_data ->> 'picture', ''),
      public.default_avatar_url(new.id)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Existing accounts without a picture get the default too. Pictures people already have are left alone.
update public.profiles
set avatar_url = public.default_avatar_url(id)
where avatar_url is null or avatar_url = '';

notify pgrst, 'reload schema';
