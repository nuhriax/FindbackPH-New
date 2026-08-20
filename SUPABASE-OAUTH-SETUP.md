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
You need a Supabase **Personal Access Token** (NOT the anon/service keys):
1. <https://supabase.com/dashboard/account/tokens> → **Generate new token** → copy it.
2. Open `scripts/configure-oauth.mjs` and paste in:
   - `supabaseAccessToken`
   - `googleClientId` / `googleClientSecret`
   - `facebookAppId` / `facebookAppSecret`
   (or set the matching `SUPABASE_ACCESS_TOKEN`, `GOOGLE_CLIENT_ID`, etc. env vars).
3. Run it:
   ```bash
   node scripts/configure-oauth.mjs
   ```
4. It prints the redirect URI confirmation. Done — providers are **ENABLED**.

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

## FAQ
- **"Access blocked: has not completed verification" (Google)** → you're fine for
  the logged-in test user; skip from consent screen. For rollout, complete Google
  verification.
- **Facebook says app not live** → use Test Users or set App Mode to Live.
- **Script fails to read project** → token is wrong/expired, or the project ref
  isn't yours. Re-check the token.
- **I want to remove/disable a provider later** → run the script with empty IDs
  for that provider (sets it disabled), or toggle in dashboard.