# Supabase email branding setup (manual)

Everything that makes the auth emails look like FindBack PH is configured in the
**Supabase dashboard** — it is not code, and only you can sign in there. This guide is
the exact checklist. **No code changes are required** for the code side; the branded
templates live in `supabase/email-templates/` and just need to be pasted in.

> ⚠ Buttons / links in the templates use Supabase Liquid placeholders
> (`{{ .ConfirmationURL }}`, `{{ .Email }}`). Do **not** replace them with anything.
> Supabase fills them per recipient at send time — this is what keeps the existing
> confirmation link working.

---

## 0. Turn ON email confirmation — this is your "no email authentication" bug

The most common reason "creating an account doesn't send a confirmation email"
is that **"Confirm email" is switched OFF** in Supabase. When it's off, Supabase
auto-approves every signup silently — no email is ever sent, and the app signs
you straight in (which reads as "it created no account and dumped me at the
homepage").

In **Supabase Dashboard → Authentication → Providers → Email → Email settings**,
turn **ON** the toggle **"Confirm email" (aka `mailer_autoconfirm = false`)**.

> The one-command script below sets this automatically too.

> 🔴 **If you never receive the confirmation email**, it's almost always the
> SMTP password. The `.env.local` placeholder
> `SMTP_PASSWORD=pame yg-mn mdbtn egrxpp` is **not a real Gmail app password**
> (note the spaces). You must paste the actual 16-character app password you
> created in Gmail → Security → App passwords. A pasted app password has no
> spaces.

---

I cannot sign into your Gmail or Supabase dashboard, so this step is yours.

1. In your Gmail account, enable **2-Step Verification** (Google requires it to
   create an app password).
2. Go to **Google Account → Security → App passwords**, create one for "Mail" /
   "Other", device name e.g. `supabase`, and copy the 16-character password.
3. Open **Supabase Dashboard → Project Settings → Auth → SMTP**.
   - Turn on **Enable custom SMTP**.
   - **Sender email:** `findback.support@gmail.com`
   - **Sender name:** `Findback Support`
   - **Host:** `smtp.gmail.com`
   - **Port:** `587`
   - **Username:** `findback.support@gmail.com`
   - **Password:** the app password from step 2 (never share this; do not store it in code)
   - **Encryption / send mode:** STARTTLS (587)
   > 🔴 **Use port 587, NOT 465.** Supabase's auth engine (GoTrue) sends email via
   > `gomail` with implicit TLS (SSL) off, so it only supports **STARTTLS on port
   > 587**. Gmail's port 465 requires true implicit TLS, which GoTrue does not
   > support — the connection fails and Supabase returns "couldn't send the
   > confirmation email" no matter how correct the app password is.
4. Save, then scroll to **Email Templates → Send test email** to confirm Gmail is
   delivering.

> Keep the **App password**, not your normal Gmail password, in the SMTP Password
> field. Your normal Gmail password will often be rejected for "less secure apps".

---

## 2. Add the two branded email templates (manual)

Two templates are used by this app. In the dashboard, **Authentication → Email
Templates**:

### Confirm signup
1. Open **Confirm signup**, toggle **Enable**.
2. Open `supabase/email-templates/confirm-signup.html`, copy the whole file
   (`<!DOCTYPE html>` → `</html>`) into the **HTML** box.
3. **Subject field:** `Confirm your email · FindBack PH`
4. Save.

### Reset password
1. Open **Reset password**, toggle **Enable**.
2. Open `supabase/email-templates/reset-password.html`, copy the whole file into
   the **HTML** box.
3. **Subject field:** `Reset your password · FindBack PH`
4. Save.

> The header shows **Findback Support** and the footer
> `findback.support@gmail.com`, not "Supabase Auth".

---

## 3. Verify redirect / site URL (keeps the confirmation link working)

The confirmation link comes from Supabase and points at your Site URL / Redirect
URLs, then your app's `/auth/callback` page exchanges the one-time `code` for a
session. Make sure these match your deployed origin:
- **Auth → URL Configuration → Site URL**: `https://<your-domain>` (e.g.
  `https://findback-ph.vercel.app`)
- **Auth → URL Configuration → Redirect URLs** must include
  `<your-site-url>/auth/callback`.
- In production, set `NEXT_PUBLIC_SITE_URL` to the same origin in Vercel.

The code change to `src/lib/actions/auth.ts` already sends signup confirmations to
`<NEXT_PUBLIC_SITE_URL>/auth/callback`.

---

## 4. Confirm the "from" branding takes effect

With custom SMTP on and the sender name set to `Findback Support`, the **From** shown
to recipients is:
```
Findback Support <findback.support@gmail.com>
```
This replaces the default "Supabase Auth".

---

## What "Supabase Auth" from-name means without custom SMTP

Until you enable custom SMTP (step 1), Supabase sends from its own
`noreply@supabase.co` and shows **Supabase Auth**. That sender name is controlled by
**your Supabase plan's DNS / email config**, not by a code template — only custom SMTP
makes it read `Findback Support`. The visual template works either way, but the
visible sender name will be `Supabase Auth` until you connect Gmail.

---

## Files changed (this task)

| Path | What |
| ---- | ---- |
| `public/brand/findback-logo.svg` | SVG copy of your existing logo (for a future dashboard "Company Logo" field) |
| `supabase/email-templates/confirm-signup.html` | Branded, mobile-friendly confirm email |
| `supabase/email-templates/reset-password.html` | Branded, mobile-friendly reset email |
| `supabase/email-templates/README.md` | Reference for the template files |
| `src/lib/actions/auth.ts` | Adds `emailRedirectTo` (only when env set) — no secrets, no breakage |
| `scripts/configure-email.mjs` | One-command automation: writes SMTP + site URL + redirect + templates via Management API (secrets come from ignored `.env.local`) |