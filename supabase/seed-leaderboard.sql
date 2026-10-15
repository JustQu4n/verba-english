-- DEV ONLY: fake learners to try the leaderboard. Not part of seed.sql, do not run on production.
-- Run in the SQL Editor after migrations 0007 and 0012. Safe to re-run.
--
-- Creates 12 fake accounts (seed-NN@verba.test, they cannot sign in) whose points are all HIGHER than every real
-- learner's, so real accounts (yours included) land at rank 13 or lower, outside the top 10.
--
-- Remove them again with:
--   delete from auth.users where email like 'seed-%@verba.test';   -- profiles are deleted with them

with seed (n, full_name) as (
  values
    (1,  'Nguyễn Minh Anh'),
    (2,  'Trần Quốc Bảo'),
    (3,  'Lê Thu Hà'),
    (4,  'Phạm Gia Huy'),
    (5,  'Võ Khánh Linh'),
    (6,  'Đặng Hoàng Long'),
    (7,  'Bùi Thảo Nguyên'),
    (8,  'Hồ Mai Phương'),
    (9,  'Ngô Tuấn Kiệt'),
    (10, 'Đỗ Ngọc Lan'),
    (11, 'Dương Anh Thư'),
    (12, null)    -- no name: shown as "Người dùng"
),
created as (
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  select ('00000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid,
         '00000000-0000-0000-0000-000000000000',
         'authenticated', 'authenticated',
         'seed-' || lpad(n::text, 2, '0') || '@verba.test',
         case when full_name is null then '{}'::jsonb else jsonb_build_object('full_name', full_name) end,
         now() - (n || ' days')::interval, now()
    from seed
  on conflict (id) do nothing
  returning id
)
select count(*) as new_fake_accounts from created;

-- Points: base = the best real learner's points, so every fake account is above all real ones (rank 1 is highest).
update public.profiles p
   set points = (
         select coalesce(max(r.points), 0) from public.profiles r
          where r.id not in (select id from auth.users where email like 'seed-%@verba.test')
       ) + 160 - 10 * s.n
  from generate_series(1, 12) as s (n)
 where p.id = ('00000000-0000-4000-8000-0000000000' || lpad(s.n::text, 2, '0'))::uuid;
