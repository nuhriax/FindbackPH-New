/**
 * configure-email.mjs
 * -----------------------------------------------------------------------------
 * One-command Supabase email branding setup — SMTP (Gmail) + branded templates
 * + confirmation redirect URLs.
 *
 * Uses Supabase's official Management API, same as configure-oauth.mjs, so you
 * don't have to click through the dashboard.
 *
 * WHAT THIS STILL REQUIRES (only you can do these):
 *   1. Gmail 2-Step Verification ON + an App password  -> you did this.
 *   2. A Supabase PERSONAL ACCESS TOKEN (not anon/service).
 *      Create at: https://supabase.com/dashboard/account/tokens
 *   3. Your Gmail App password as SMTP_PASSWORD (a secret — never committed).
 *
 * USAGE (secrets come from .env.local, which is git-ignored — never hardcoded):
 *   1) Add these to .env.local:
 *        SUPABASE_ACCESS_TOKEN=...   (your Supabase PAT)
 *        SMTP_PASSWORD=...           (your Gmail App password — the 16-char one)
 *      NEXT_PUBLIC_SITE_URL is already read from .env.local.
 *   2) Run:   node scripts/configure-email.mjs
 *   3) Verify nothing printed a password (it won't).
 * -----------------------------------------------------------------------------
 */
import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** Load KEY=value .env lines into process.env (never overwrite existing). */
function loadDotEnv(path) {
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadDotEnv(".env.local");

const __dir = dirname(fileURLToPath(import.meta.url)); // .../scripts
const root = join(__dir, "..");

const ref = process.env.SUPABASE_PROJECT_REF || "llmxwvclxiiwczcnbsrt";
const token = process.env.SUPABASE_ACCESS_TOKEN || "";
const smtpPass = process.env.SMTP_PASSWORD || "";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
// Read the rest of the SMTP settings from .env.local so this script matches
// whatever is configured (host/port/user/sender). Falls back to Gmail values.
const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = process.env.SMTP_PORT || "587";
const senderEmail = process.env.SMTP_USER || process.env.SMTP_SENDER_EMAIL || "findback.support@gmail.com";
const senderName = process.env.SMTP_SENDER_NAME || "Findback Support";

const API = `https://api.supabase.com/v1/projects/${ref}/config/auth`;

function fail(msg) {
  console.error("\n[error] " + msg + "\n");
  process.exit(1);
}
const redact = (v) => (v ? `<set (${v.length} chars)>` : "<EMPTY — still needs setup>");

async function main() {
  if (!token) fail(
    "Missing SUPABASE_ACCESS_TOKEN (your Supabase PAT).\n" +
    "Create one at https://supabase.com/dashboard/account/tokens and add it to .env.local"
  );
  if (!smtpPass) fail(
    "Missing SMTP_PASSWORD (your Gmail App password).\nAdd SMTP_PASSWORD=... to .env.local"
  );
  if (!siteUrl) fail("Missing NEXT_PUBLIC_SITE_URL in .env.local.");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // --- 1) Read current config so we MERGE, never wipe other settings. ---
  console.log("Fetching current auth config...");
  const existingRes = await fetch(API, { headers });
  const existing = await existingRes.json();
  if (existing?.error || !existingRes.ok)
    fail(`Could not read project config — token valid & ref correct? (${existing?.error ?? existingRes.status})`);

  // uri_allow_list is a COMMA-SEPARATED STRING of allowed redirect URLs.
  const curList = typeof existing.uri_allow_list === "string" && existing.uri_allow_list.trim()
    ? existing.uri_allow_list.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const cb = `${siteUrl}/auth/callback`;
  const redirectUrls = curList.includes(cb) ? curList : [...curList, cb];

  console.log("Will write:\n" +
    "  site_url        " + siteUrl + "\n" +
    "  redirect_urls   " + redirectUrls.join(", ") + "\n" +
    "  smtp_host       " + smtpHost + "\n" +
    "  smtp_port       " + smtpPort + "\n" +
    "  smtp_user       " + senderEmail + "\n" +
    "  smtp_sender     " + senderName + "\n" +
    "  smtp_admin_email " + senderEmail + "\n" +
    "  smtp_pass       " + redact(smtpPass) + "\n" +
    "  email_confirm   REQUIRED (mailer_autoconfirm = false)\n");

  // --- 2) SMTP + site URL + redirect URLs in ONE flat PATCH ----------------
  console.log("Enabling Gmail SMTP + confirmation redirect URL...");
  const body = {
    site_url: siteUrl,
    uri_allow_list: redirectUrls.join(","),
    // Remember the "Confirm email" toggle: false = new users MUST confirm via
    // email before the session becomes usable. This is the "email authentication"
    // step — without it, accounts are auto-approved and no confirmation email
    // is ever sent (which is exactly the "no email" symptom reported).
    mailer_autoconfirm: false,
    smtp_host: smtpHost,
    smtp_port: smtpPort,
    smtp_user: senderEmail,
    smtp_pass: smtpPass,
    smtp_admin_email: senderEmail,
    smtp_sender_name: senderName,
  };
  let res = await fetch(API, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
  let out = await res.json();
  if (!res.ok) fail(`Supabase rejected SMTP/URL update: ${JSON.stringify(out?.error ?? out)}`);
  console.log("SMTP + site URL + redirect URL saved. ✅");

  // --- 3) Upload branded templates ---------------------------------------
  // The config schema stores templates as flat string fields, so we include
  // them all in ONE more PATCH (content + subject per template type).
  const templates = [
    {
      type: "confirmation",
      file: "confirm-signup.html",
      subject: "Confirm your email · FindBack PH",
    },
    {
      type: "recovery",
      file: "reset-password.html",
      subject: "Reset your password · FindBack PH",
    },
  ];

  const templateBody = {};
  for (const t of templates) {
    const path = join(contentDir, t.file);
    if (!existsSync(path)) fail(`Missing template file: ${path}`);
    // Strip the explanatory header comment, keep the rest intact.
    const html = readFileSync(path, "utf8").replace(/^\s*<!--[\s\S]*?-->\s*/, "");
    templateBody[`mailer_templates_${t.type}_content`] = html;
    templateBody[`mailer_subjects_${t.type}`] = t.subject;
    console.log(`Packed ${t.type} template + subject.`);
  }
  console.log("Uploading branded templates...");
  res = await fetch(API, {
    method: "PATCH",
    headers,
    body: JSON.stringify(templateBody),
  });
  out = await res.json();
  if (!res.ok) fail(`Supabase rejected template upload: ${JSON.stringify(out?.error ?? out)}`);
  console.log("Templates uploaded. ✅");

  // --- 4) Verify (never prints the password) ------------------------------
  console.log("\nVerifying...");
  const ver = await (await fetch(API, { headers })).json();
  if (ver?.error) fail("Could not re-read config for verification.");
  console.log(
    "  smtp_host       " + (ver.smtp_host || "-") + "\n" +
    "  smtp_port       " + (ver.smtp_port || "-") + "\n" +
    "  smtp_user       " + (ver.smtp_user || "-") + "\n" +
    "  sender name     " + (ver.smtp_sender_name || "-") + "\n" +
    "  smtp admin      " + (ver.smtp_admin_email || "-") + "\n" +
    "  email confirm   " + (ver.mailer_autoconfirm === false ? "REQUIRED (email confirmation ON)" : "OFF — new signups auto-confirm (no email step)") + "\n" +
    "  site_url        " + (ver.site_url || "-") + "\n" +
    "  redirect URLs   " + (typeof ver.uri_allow_list === "string" ? ver.uri_allow_list : "(empty)") + "\n" +
    "  confirm subject " + (ver.mailer_subjects_confirmation || "(check template)") + "\n" +
    "  recovery subject " + (ver.mailer_subjects_recovery || "(check template)") + "\n"
  );
  console.log("✅ Done. Your Supabase auth emails are branded & delivered via findback.support@gmail.com.\n" +
    "(No passwords were printed. Keep your PAT + App password private.)");
}

// Resolved from the file's own location (works wherever you run node from).
const contentDir = join(root, "supabase", "email-templates");

main().catch((e) => fail(e?.message || String(e)));