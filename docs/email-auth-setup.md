# Email and password sign-in: setup and testing

Spec: `specs/008-email-auth/spec.md` (acceptance criteria `EML-AC-*`). The code needs no extra environment variables beyond the ones in `.env.example`; everything else is Supabase dashboard configuration.

## 1. Enable the Email provider
**Authentication → Sign In / Providers → Email**: turn **Enable Email provider** on (it is on by default).

## 2. Decide on email confirmation
Under the same page, **Confirm email**:

| Setting | Behaviour |
|---|---|
| On (recommended for production) | Sign-up shows the "Check your email" screen. The user opens the link and lands on `/dashboard`. Signing in before confirming shows an error with a **Resend** button. Registering an email that already exists looks identical to a new sign-up, so emails are not leaked. |
| Off (handy for local development) | Sign-up signs the user in immediately and redirects to `/dashboard`. Registering an existing email shows "This email is already registered". |

## 3. Redirect URLs
The confirmation link returns to `/auth/callback`. In **Authentication → URL Configuration** add:

- `http://localhost:3000/auth/callback`
- `https://<your-domain>/auth/callback`

and set **Site URL** to the production domain. See `docs/google-login-setup.md`, step 4, for details and common mistakes.

## 4. Email delivery
Supabase's built-in sender is rate limited (a few emails per hour) and meant for testing. For production configure a custom SMTP server under **Authentication → Emails → SMTP Settings**. A rate-limited request shows the "You're going too fast" message.

## 5. Password policy
The app requires 8–72 characters with at least one letter and one digit. You may also raise the minimum length under **Authentication → Sign In / Providers → Email** (a stricter policy shows "That password is too weak"). Do not set it above 72.

## 6. Profile name
The full name typed at sign-up is stored in the user metadata (`full_name`) and copied into `public.profiles.full_name` by the trigger from `supabase/migrations/0001_profiles.sql` (extended by `0002`). Make sure both migrations have been run.

## 7. Manual test (EML-AC-11 to EML-AC-16)
1. Open `/login`, switch to **Create account** (or open `/login?mode=signup`).
2. Submit the empty form: every field shows its own error. Try a weak password (`abcdefgh`) and two different passwords.
3. Register with a real email. With confirmation on you see "Check your email"; press **Resend** once.
4. Click the link in the email: you land on `/dashboard`, and your name shows in the navbar on the home page.
5. Sign out, then sign in with the wrong password: "Incorrect email or password." (it does not say which part was wrong).
6. Repeat the above at `/en/login` and check that every message is English.
7. Check the layout at 390px wide.

## Error codes
The app shows translated messages for these codes (see `messages/*.json`, `Login.formErrors`): `name_required`, `name_too_long`, `email_invalid`, `password_required`, `password_too_short`, `password_too_long`, `password_weak`, `password_mismatch`, `invalid_credentials`, `email_not_confirmed`, `email_taken`, `weak_password`, `rate_limited`, `unknown`. Anything unexpected is logged on the server and shown as `unknown`; raw Supabase messages are never shown.
