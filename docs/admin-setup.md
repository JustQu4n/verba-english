# Admin setup

Admins sign in with email and password like any other account. What makes an account an admin is `profiles.role = 'admin'`.
Nothing in the app can set it; you do it once per admin directly in the database.

## 1. Apply the migrations
Run `supabase/migrations/0003_writing_schema.sql` and `0004_admin_prompts.sql` in order (Supabase → SQL Editor, or `supabase db push`).
`0004` adds the `role` column, locks it against self-promotion, adds the `is_admin()` helper and the admin-only policies on `prompts`.

## 1b. Load the sample prompts (optional)
Run `supabase/seed.sql` in the SQL Editor. It inserts 60 published sentence prompts (3 per category) and, once migration 0008 is applied, their accepted answers with grammar notes and can be re-run safely: rows that already exist are skipped. `supabase db reset` runs it automatically.

## 2. Create the admin account
Sign up with email and password on `/login` (confirm the email if "Confirm email" is on).

## 3. Promote it
In the SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@example.com');
```

Sign out and in again is not required; the role is read on every request.

## 4. Use it
Open `/dashboard`. An **Admin** card appears for admins and leads to `/admin/prompts`.
Non-admins get a 404 on `/admin/*`, and guests are sent to `/login`.

## Security notes
- `role` is not writable from the browser: `authenticated` only has column-level `INSERT`/`UPDATE` on `id`, `full_name` and `avatar_url`.
  To check, from a normal user's session run `supabase.from("profiles").update({ role: "admin" }).eq("id", me)`; it must fail.
- Admin writes use the admin's own session and Row Level Security (`public.is_admin()`); the service role key is not used.
- Demote an admin by setting `role = 'user'` the same way.

## Dữ liệu thử cho bảng xếp hạng (chỉ môi trường dev)

Chạy `supabase/seed-leaderboard.sql` trong SQL Editor (sau migration 0012). Script tạo 12 tài khoản giả `seed-NN@verba.test` có điểm cao hơn mọi người học thật, nên tài khoản của bạn nằm ngoài top 10. Chạy lại an toàn. Xóa dữ liệu thử: `delete from auth.users where email like 'seed-%@verba.test';`

## Dữ liệu mẫu trình độ beginner

Chạy lần lượt trong SQL Editor: `supabase/seed-beginner.sql` (200 câu, 10 câu mỗi chủ đề) rồi `supabase/seed-beginner-answers.sql` (mỗi câu 2 đáp án chuẩn kèm ghi chú ngữ pháp Vi/En, cần migration 0008). Cả hai chạy lại an toàn: đề đã có thì bỏ qua, đề đã có đáp án thì giữ nguyên bản admin đã sửa.
