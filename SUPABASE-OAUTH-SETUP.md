# SUPABASE-OAUTH-SETUP — Google & Facebook login

This app has **Google + Facebook login fully coded**. To make the buttons work,
you must create two developer apps (only *you* can do this — it requires signing
into your Google and Facebook accounts). The Supabase side is automated for you.

**Your project ref** (already used by the script): `llmxwvclxiiwczcnbsrt`

**Callback / redirect URI** you'll paste twice below:
```
https://llmxwvclxiiwczcnbsrt.supabase.co/auth/v1/callback
```

---

## ✅ STATUS — Google is DONE
Your Google Login is **enabled in Supabase**. Your Google **Client ID + Secret**
are stored in:
- `.env.local` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) — locally only,
  never committed to the repo (it's git-ignored).

Your Google redirect URI is set to the correct Supabase callback. **No Google
console work is needed.** The `configure-oauth.mjs` script reads these values
from the environment variables `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
(never hardcodes them) so they can't leak into git history.

> 🔒 Security note: never commit OAuth client secrets. Keep them in `.env.local`
> (or your Vercel project env vars) and reference them via env variables.

---

## Step 2 — Facebook (only if you want Facebook login)
1. Go to <https://developers.facebook.com> → sign in → **My Apps → Create App**.
2. Use case: **Authenticate and request data from users** → **Facebook Login for Business** → Next.
3. App name: `findback-ph` → Create.
4. Open the app → **Facebook Login** product (left menu) → **Settings**.
5. Under **Valid OAuth redirect URIs**, paste:
   ```
   https://llmxwvclxiiwczcnbsrt.supabase.co/auth/v1/callback
   ```
   Save.
6. Copy the **App ID** and **App Secret**
   (App Dashboard → **Settings → Basic** → "App secret" → **Show**).
7. For testing, set **App Mode** to **Live**, or add yourself as a
   **test user** in the **Roles → Test users** page.

> Facebook Login works for your own account right away. Publishing/Live access
> for all users may require app review, but you can test instantly as yourself.

**Result:** `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET`.

---

## Step 3 — Turn on the providers in Supabase (AUTOMATED)
The script reads Google / Facebook / Supabase values from `.env.local`
(and from env vars `SUPABASE_ACCESS_TOKEN` / `GOOGLE_CLIENT_ID` / etc.).
So your credentials just need to live in `.env.local`, then run:
```bash
node scripts/configure-oauth.mjs
```
It prints the redirect URI confirmation. Done — providers are **ENABLED**.

> You need a valid Supabase **Personal Access Token** set as `SUPABASE_ACCESS_TOKEN`
> for the script to authenticate: <https://supabase.com/dashboard/account/tokens>.
> The anon/service keys won't work here — this is the management token only.

---

## Step 4 — Site URL (optional but recommended)
In Supabase → **Authentication → URL Configuration → Site URL**, set:
```
http://localhost:3000
```
(or your production origin). The app already sends the browser to
`<origin>/auth/callback` via `NEXT_PUBLIC_SITE_URL`.

---

## Step 5 — Verify end-to-end
1. `npm run dev` → open <http://localhost:3000/login>.
2. Click **"Continue with Google"** → sign in → you should land on the Dashboard.
3. Click **"Continue with Facebook"** → same.
4. Both work → your authentication is complete. 🎉

---

## Step 6 — Deploy to Vercel & set env vars there
Your local `.env.local` does **not** reach Vercel — the public site reads vars from
**Vercel's** Environment Variables. So after you deploy:

1. In the Vercel dashboard, open your `findback-ph` project →
   **Settings → Environment Variables** → add **each** of these with your real values:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   NEXT_PUBLIC_SITE_URL
   GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET
   FACEBOOK_APP_ID
   FACEBOOK_APP_SECRET
   ```
2. `NEXT_PUBLIC_SITE_URL` must be your **live** origin (e.g. `https://findback-ph.vercel.app`),
   **not** `localhost`, or OAuth/email links will redirect to your PC.
3. Rename the file `.env.example` → `.env` and fill the same values if you want a
   portable copy — but the **deployed** copy of these vars is what matters for the live site.
4. Redeploy (or trigger a new deploy from the **Deployments** tab) so the build picks
   up the new env vars.
5. Open `https://findback-ph.vercel.app/login` — if it loads instead of HTTP 500 and
   the Google/Facebook buttons work, you're done. If it still 500s, a var is missing.

> If you see **HTTP 500 on every page**, it is almost always a missing
> `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel —
> add both and redeploy.

---

## FAQ
- **"Access blocked: has not completed verification" (Google)** → you're fine for
  the logged-in test user; skip from consent screen. For rollout, complete Google
  verification.
- **Facebook says app not live** → use Test Users or set App Mode to Live.
- **Script fails to read project** → token is wrong/expired, or the project ref
  isn't yours. Re-check the token.
- **I want to remove/disable a provider later** → run the script with empty IDs
  for that provider (sets it disabled), or toggle in dashboard.