# Avatar storage setup (Supabase Storage)

Profile pictures are stored in a public Storage bucket named `avatars`, one folder per user (`<user id>/<random>.webp`).

## 1. Run the migration
SQL Editor → run `supabase/migrations/0015_avatars_storage.sql`. It creates the bucket (public, 512 KB, JPG/PNG/WebP only) and the policies that let a user write only inside their own folder.
Check: **Storage → Buckets** shows `avatars` marked *Public*.

## 1b. Default picture
Run `supabase/migrations/0016_default_avatar.sql` too. New accounts then start with a generated black and white picture (their Google photo if they sign in with Google), and existing accounts without a picture get it as well. The picture comes from DiceBear (`api.dicebear.com`) and is built from the user id only. If you would rather host your own default, change `default_avatar_url()` in the migration and `defaultAvatarUrl()` in `src/modules/profile/domain/avatar.ts` together.

## 2. Try it
Sign in as a learner → menu → **Hồ sơ** → **Thêm ảnh**. The file appears under `avatars/<your user id>/` in Storage, and `profiles.avatar_url` holds its public address.

## 3. Check the policies (PRP-AC-15)
With two accounts A and B, as B try to write into A's folder (SQL Editor, replace the ids):
```sql
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '<B user id>')::text, true);
insert into storage.objects (bucket_id, name, owner) values ('avatars', '<A user id>/x.webp', '<B user id>');
```
It must fail with `new row violates row-level security policy`. Reading a file by its public address works for everyone (the bucket is public).

## Notes
- Pictures are cropped to a square and shrunk to 256×256 in the browser before upload, so each one is a few tens of KB.
- Changing or removing a picture deletes the old file. Google profile photos are never touched.
- The server uses the signed-in user's own session (not the service role) to write files, so the policies are what protect other users' folders.
