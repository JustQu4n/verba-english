# Google sign-in setup (Supabase + Google Cloud)

Spec: [`specs/004-google-login`](../specs/004-google-login/spec.md). Steps 1–6 are done once on the dashboards; the code is already ready.

> **Two easily confused URLs:**
> - **Redirect URI on Google** = the **Supabase** callback URL: `https://<PROJECT-REF>.supabase.co/auth/v1/callback`
> - **Redirect URLs on Supabase** = the **application** callback URL: `http://localhost:3000/auth/callback`

## 1. Get the Supabase callback URL
Supabase Dashboard → **Authentication → Sign In / Providers → Google**. Copy the **Callback URL (for OAuth)** (shaped like `https://<PROJECT-REF>.supabase.co/auth/v1/callback`). You can see this URL even before enabling Google.

## 2. Create an OAuth client in Google Cloud Console
1. <https://console.cloud.google.com> → create (or select) a **project**.
2. Go to **Google Auth Platform** (the old **APIs & Services → OAuth consent screen** menu has moved here):
   - **Branding:** app name, support email.
   - **Audience:** choose **External**. While in *Testing*, only the **Test users** you add can sign in → add your email. When going to production, click **Publish app**.
   - **Data Access (Scopes):** `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile` (enough for sign-in; do not add sensitive scopes to avoid verification).
3. **Clients → Create client → Web application**:
   - **Authorized JavaScript origins:** `http://localhost:3000` and the production URL, e.g. `https://english.example.com` (scheme + domain only, no path).
   - **Authorized redirect URIs:** paste the **Supabase Callback URL** from step 1 (a single line; do not add the application's URL).
4. Click **Create**, then copy the **Client ID** and **Client secret**.

## 3. Enter the Client ID / Secret in Supabase
**Authentication → Sign In / Providers → Google** → turn on **Enable Sign in with Google** → paste the **Client ID** and **Client Secret** → **Save**.
Do *not* put the Client Secret in code, the app's `.env`, or the repo — it lives only in Supabase.

## 4. Site URL and Redirect URLs
**Authentication → URL Configuration:**

| Item | Local | Production |
|---|---|---|
| **Site URL** | `http://localhost:3000` | `https://english.example.com` |
| **Redirect URLs** (add both) | `http://localhost:3000/auth/callback` | `https://english.example.com/auth/callback` |

- Site URL holds a single value: use the production URL once deployed, and `http://localhost:3000` while developing (or use a separate Supabase project for dev).
- Every URL passed as `redirectTo` must be in the Redirect URLs list, otherwise Supabase sends the user to the Site URL.
- Preview deployments (e.g. Vercel): add a pattern such as `https://*-your-team.vercel.app/auth/callback`.

## 5. App environment variables
In `.env` (local) and in the hosting configuration (production):
```
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT-REF>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000        # production: https://english.example.com
```
Restart `npm run dev` after editing `.env`.

## 6. Run the migration for profiles from Google
Paste `supabase/migrations/0002_profile_from_oauth.sql` into the **SQL Editor** and run it (after `0001_profiles.sql`). This migration makes the profile take its name and avatar from Google automatically.

## 7. Manual testing (GGL-AC-10)
1. Open `http://localhost:3000/login` → **Tiếp tục với Google** (the Vietnamese button label; "Continue with Google" in English) → pick an account → you should land on `/dashboard` and see your email.
2. Open `http://localhost:3000/api/me` → see `fullName` / `avatarUrl` from Google (GGL-AC-09).
3. **Sign out** → back to `/login`. Open `/dashboard` → redirected to `/login`.
4. Sign in again → fully close the browser → reopen `/dashboard` → still signed in (session refreshed).
5. Click **Cancel** on the Google screen → back to `/login` with an error message.

## Common errors
| Symptom | Cause / fix |
|---|---|
| Google: `redirect_uri_mismatch` | The Redirect URI from step 2 does not match the **Supabase Callback URL** (wrong project ref, missing `https`, extra trailing `/`). |
| Google: `Access blocked` / `Error 403: access_denied` | The app is in *Testing* and your email is not in **Test users**. |
| `/login?error=oauth_failed` | Google returned an error or you cancelled; also check the Supabase logs (**Logs → Auth**). |
| `/login?error=auth_failed` | Code exchange failed: the PKCE cookie was lost (domain changed between start and return, e.g. `127.0.0.1` ↔ `localhost`) or the code expired. Always use the same address. |
| After sign-in you land on the home page/Site URL instead of `/dashboard` | `…/auth/callback` is not in **Redirect URLs** (step 4). |
| In production Google returns to `http://localhost:3000/auth/callback?code=...` | Supabase fell back to a **Site URL** of `localhost` because the production callback is not in **Redirect URLs**. Set **Site URL** to your production domain and add `https://<your-domain>/auth/callback` (step 4). The app now builds the callback from the request host, so `NEXT_PUBLIC_SITE_URL` no longer decides it; set it anyway to the production domain (it is read at build time, so redeploy after changing it). |
| `Unsupported provider: provider is not enabled` (log) | Google was not enabled in step 3. |
| Google sign-in with the same email as a password account | Supabase automatically links identities with the same verified email into one user. |
