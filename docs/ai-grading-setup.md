# AI grading setup

Sentences are graded by Gemini. A wrong answer costs 1 credit each time it is sent (retries included); a correct answer is free. Every new account starts with 10 (migration `0014_initial_credits_10.sql`; it changes only the default, existing balances stay). Feedback follows the interface language.

## 1. Database
Run `supabase/migrations/0005_credits.sql` in the SQL Editor (after 0003 and 0004). It adds `profiles.credits` (default 100, never negative) and the `spend_credits(amount)` function.
Existing accounts got 100 credits when it ran. To change one by hand: `update public.profiles set credits = 10 where id = '...';`

Then run `supabase/migrations/0006_sentence_progress.sql`. It adds `sentence_completions` (which sentences each learner finished) so completed sentences are not shown again and progress can be shown.

Then run `supabase/migrations/0007_points.sql`. It adds `profiles.points` (10 points per completed sentence, for the leaderboard) and moves recording a completion to the server-only `complete_sentence` function.
**It requires `SUPABASE_SERVICE_ROLE_KEY`** in `.env.local` and in your hosting provider's variables (server-only, never `NEXT_PUBLIC_`). Without it, a correct answer cannot be recorded.

Then run `supabase/migrations/0008_accepted_answers.sql`. It adds `prompt_answers` (accepted answers per prompt, readable by admins only). An answer that equals an accepted answer is graded correct without the AI, so it also works when the AI quota is used up. Admins fill them in the prompt form ("Accepted answers"), optionally with the "Suggest with AI" button. Server code reads them with `SUPABASE_SERVICE_ROLE_KEY`; if that read fails, grading falls back to the AI.

Then run `supabase/migrations/0009_sentence_progress_table.sql`. It adds `sentence_progress`, a per-learner counter of completed sentences by level and category that the choose screen reads (it backfills from existing completions, and is rebuilt automatically when an admin deletes, unpublishes or moves a prompt).

Then run `supabase/migrations/0010_attempt_history.sql`. It creates `practice_attempts`, `submissions` and `evaluations`, which keep every correct answer (what the learner wrote and the feedback) for the "My attempts" page. It replaces older tables with the same names only if they are empty, and stops otherwise. Like completions, history is written by the server with `SUPABASE_SERVICE_ROLE_KEY`; if saving fails, grading still works.

Then run `supabase/migrations/0011_attempt_history_limits.sql`. It keeps the history small: wrong answers are removed, sending the same answer again updates one row (with a counter) and only the 5 newest different correct answers per learner and sentence are kept.

## 2. Gemini key
1. Create a key at <https://aistudio.google.com/apikey>.
2. Put it in `.env.local` as `GEMINI_API_KEY=...` and in your hosting provider's environment variables (Vercel: Project → Settings → Environment Variables), then redeploy.
3. Never use the `NEXT_PUBLIC_` prefix: the key must stay on the server.

Optional: `GEMINI_MODEL` (default `gemini-3.5-flash-lite`) and `GEMINI_THINKING_LEVEL` (default `minimal`; models such as `gemini-3.8-flash` need `low`).
Check the current model names and free-tier limits at <https://ai.google.dev/gemini-api/docs/models>.

## How quota is saved
- Small, fixed instruction and a JSON reply of about 100 tokens; output capped at 600 tokens; lowest thinking level; `store: false`.
- The same answer to the same prompt in the same language (whitespace aside) is served from a server-side cache: no Gemini call, no credit.
- The learner cannot resend an unchanged answer.
- The balance is checked before calling Gemini and credits are taken only after it answered and only for a wrong answer, so errors never cost credits.

## Checks for AIG-AC-20 (run in the SQL Editor as the signed-in user, or via the app's Supabase client)
```sql
-- Must fail: users cannot write the column.
update public.profiles set credits = 9999 where id = auth.uid();
-- Must fail: negative amounts are rejected.
select public.spend_credits(-5);
-- Works: takes 1 credit and returns the new balance.
select public.spend_credits(1);
```

## Checks for SPG-AC-13 (signed-in user session)
```sql
-- Must fail: history cannot be edited or deleted from a user session.
delete from public.sentence_completions where user_id = auth.uid();
update public.sentence_completions set user_id = user_id where user_id = auth.uid();
-- Must fail: completions are written by the server only.
insert into public.sentence_completions (user_id, prompt_id)
select auth.uid(), id from public.prompts limit 1;
```

## Checks for PTS-AC-09 (signed-in user session)
```sql
-- Must fail: points cannot be edited by the user, nor the server function called.
update public.profiles set points = 9999 where id = auth.uid();
select * from public.complete_sentence(auth.uid(), (select id from public.prompts limit 1));
```

## Checks for ANS-AC-15 (signed-in learner session)
```sql
-- Must return no rows: learners cannot read accepted answers.
select * from public.prompt_answers;
-- Must fail: nor write them.
insert into public.prompt_answers (prompt_id, answers) select id, '[]' from public.prompts limit 1;
```

## Giving credits by hand (until purchases exist)
```sql
update public.profiles set credits = credits + 50
where id = (select id from auth.users where email = 'someone@example.com');
```
