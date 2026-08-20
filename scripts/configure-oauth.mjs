/**
 * configure-oauth.mjs
 * -----------------------------------------------------------------------------
 * One-command setup for Google + Facebook OAuth login in your Supabase project.
 *
 * Uses Supabase's official Management API so you DON'T have to click through
 * the Authentication > Providers dashboard manually.
 *
 * WHAT THIS STILL REQUIRES (only you can do these — they need your account logins):
 *   1. Create the Google OAuth Client ID  (Google Cloud Console)
 *   2. Create the Facebook developer App (developers.facebook.com)
 *   Those two steps are in SUPABASE-OAUTH-SETUP.md. This script ONLY writes the
 *   resulting Client IDs/Secrets into your Supabase project.
 *
 * USAGE:
 *   1) Paste the values below (or set them as env vars).
 *   2) Run:   node scripts/configure-oauth.mjs
 *   3) Done — providers are enabled in Supabase.
 *
 * NOTE: Your Supabase PERSONAL ACCESS TOKEN is different from the anon/service
 * keys. Create one at:  https://supabase.com/dashboard/account/tokens
 * (Account menu -> Access Tokens -> Generate new token)
 * -----------------------------------------------------------------------------
 */
import { writeFileSync } from "node:fs";

const config = {
  // ---- Your values go here ---------------------------------------------------
  supabaseProjectRef: "llmxwvclxiiwczcnbsrt",
  // Personal access token (NOT the anon/service key). Account -> Access Tokens.
  supabaseAccessToken: process.env.SUPABASE_ACCESS_TOKEN || "",
  // Google "OAuth 2.0 Client ID" -> Client ID  and  Client secret.
  // Read from environment variables (required for GitHub push protection).
  // Set them via:  set GOOGLE_CLIENT_ID=...  and  set GOOGLE_CLIENT_SECRET=...
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  // Facebook app -> App ID  and  App Secret
  facebookAppId: process.env.FACEBOOK_APP_ID || "",
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET || "",
};

const API = `https://api.supabase.com/v1/projects/${config.supabaseProjectRef}/config/auth`;

function fail(msg) {
  console.error("\n[error] " + msg + "\n");
  process.exit(1);
}

async function main() {
  if (!config.supabaseAccessToken)
    fail(
      "Missing Supabase access token.\n" +
        "Create one at https://supabase.com/dashboard/account/tokens and either:\n" +
        "  - set it here, or\n  - export SUPABASE_ACCESS_TOKEN=..."
    );
  const show = (v) => (v ? `<set (${v.length} chars)>` : "<EMPTY — still needs setup>");
  console.log("Provider values to write:\n" +
    "  Google    client_id     " + show(config.googleClientId) + "\n" +
    "  Google    client_secret " + show(config.googleClientSecret) + "\n" +
    "  Facebook  app_id        " + show(config.facebookAppId) + "\n" +
    "  Facebook  app_secret    " + show(config.facebookAppSecret) + "\n");

  const headers = {
    Authorization: `Bearer ${config.supabaseAccessToken}`,
    "Content-Type": "application/json",
  };

  // 1) Read the current config first (so we don't wipe other settings).
  console.log("Fetching current auth config...");
  const existing = await (await fetch(API, { headers })).json();
  if (existing?.error)
    fail(`Could not read project config — is the token valid & is the ref correct? (${existing.error})`);

  const body = {
    external_google_enabled: !!config.googleClientId && !!config.googleClientSecret,
    external_facebook_enabled: !!config.facebookAppId && !!config.facebookAppSecret,
  };
  if (body.external_google_enabled) {
    body.external_google_client_id = config.googleClientId;
    body.external_google_secret = config.googleClientSecret;
  }
  if (body.external_facebook_enabled) {
    body.external_facebook_client_id = config.facebookAppId;
    body.external_facebook_secret = config.facebookAppSecret;
  }

  // 2) Write the new provider config.
  console.log("Updating provider config...");
  const res = await fetch(API, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
  const out = await res.json();
  if (!res.ok) fail(`Supabase rejected the update: ${JSON.stringify(out?.error ?? out)}`);

  console.log("\n✅ Done! In Supabase now:\n" +
    "  Google:   " + (body.external_google_enabled ? "ENABLED" : "not configured (empty IDs)") + "\n" +
    "  Facebook: " + (body.external_facebook_enabled ? "ENABLED" : "not configured (empty IDs)") + "\n");

  // 3) Write the callback URL the providers must allow.
  const callback = `https://${config.supabaseProjectRef}.supabase.co/auth/v1/callback`;
  console.log("\nRedirect URI to add in Google & Facebook consoles:\n  " + callback + "\n" +
    "(paste exactly this into the checklist's redirect-URI fields)");

  // Keep values for reference (without printing secrets).
  const ref = { callback, google: show(config.googleClientId), facebook: show(config.facebookAppId) };
  writeFileSync("scripts/.oauth-written.json", JSON.stringify(ref, null, 2));
  console.log("Wrote reference to scripts/.oauth-written.json (no secrets included).");
}

main().catch((e) => fail(e?.message || String(e)));