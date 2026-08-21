# FindBack PH — Supabase email templates

These are the **branded, mobile-friendly HTML templates** to paste into your Supabase
dashboard. They mirror the website's visual identity:

- Primary teal `#0F7B72` (buttons / links)
- Lighter teal accent `#20948F`
- Warm sand page background `#FBF6EF`
- Warm espresso text `#2E2417`
- Light teal surfaces `#E7F7F2`
- Brand wordmark **FindBack** (espresso) + **PH** (teal)

## Files

| File                          | Dashboard template name        |
| ----------------------------- | ------------------------------- |
| `confirm-signup.html`         | **Confirm signup**              |
| `reset-password.html`         | **Reset password**              |

> Only these two are used by this app today. Google/Facebook sign-in does not send a
> confirmation email, but OAuth still relies on the **Site URL** + **Redirect URLs**
> configured in the dashboard (see `SUPABASE-EMAIL-BRANDING-SETUP.md`).

## Variables used (Supabase Liquid syntax)

These are the safe, documented placeholders. Do **not** replace them — Supabase fills
them per recipient at send time.

| Placeholder | Meaning                                                   |
| ----------- | --------------------------------------------------------- |
| `{{ .ConfirmationURL }}` | The single-use confirmation / reset link (kept working) |
| `{{ .SiteURL }}`         | The Site URL configured in the dashboard              |
| `{{ .Email }}`           | The recipient's email address                        |

## How to install each file

1. Open your **Supabase Dashboard → Authentication → Email Templates**.
2. Select the matching template (e.g. **Confirm signup**).
3. Turn **Enable** / **Use a custom template** on.
4. Copy the entire contents of the matching `.html` file (from `<!DOCTYPE html>` to `</html>`)
   into the **HTML** box.
5. Set the **Subject** (suggested values are commented at the top of each file).
6. Save, then click **Send test email** to verify.

> The button and fallback link both point at `{{ .ConfirmationURL }}`. As long as your
> dashboard **Site URL** and **Redirect URLs** are correct, the confirmation link keeps
> working exactly as before.