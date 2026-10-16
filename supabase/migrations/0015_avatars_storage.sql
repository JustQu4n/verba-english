-- Profile pictures: a public Storage bucket `avatars`, one folder per user. Run after 0014.
-- Reading is public (the pictures are shown to other learners on the leaderboard); writing is limited to the
-- user's own folder `<user id>/...`, so nobody can overwrite or delete another person's picture.

-- 1. The bucket. The size and type limits are enforced by Storage itself, on top of the checks in the app.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 524288, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. Policies on storage.objects (RLS is already on). A public bucket serves files without a select policy,
--    but the app also lists and deletes through the API, so the owner gets explicit rights.
drop policy if exists "Avatars: owner can read" on storage.objects;
create policy "Avatars: owner can read"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Avatars: owner can upload" on storage.objects;
create policy "Avatars: owner can upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Avatars: owner can replace" on storage.objects;
create policy "Avatars: owner can replace"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Avatars: owner can delete" on storage.objects;
create policy "Avatars: owner can delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
