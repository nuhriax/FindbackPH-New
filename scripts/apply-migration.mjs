/**
 * apply-migration.mjs
 * -----------------------------------------------------------------------------
 * Runs a SQL file against the project's database via the Supabase Management
 * API (same pattern as configure-storage.mjs / configure-email.mjs) so you
 * don't have to paste into the SQL editor by hand.
 *
 * REQUIRES (in .env.local, which is git-ignored):
 *   SUPABASE_ACCESS_TOKEN=...   a Supabase PERSONAL ACCESS TOKEN
 *
 * USAGE:
 *   node scripts/apply-migration.mjs supabase/108-registered-views-only.sql
 * -----------------------------------------------------------------------------
 */
import { readFileSync, existsSync } from "node:fs";

function loadDotEnv(path) {
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadDotEnv(".env.local");

const sqlPath = process.argv[2];
if (!sqlPath) {
  console.error("Usage: node scripts/apply-migration.mjs <path/to/file.sql>");
  process.exit(1);
}
if (!process.env.SUPABASE_ACCESS_TOKEN) {
  console.error("Missing SUPABASE_ACCESS_TOKEN in .env.local");
  process.exit(1);
}

const ref = process.env.SUPABASE_PROJECT_REF || "llmxwvclxiiwczcnbsrt";
const url = `https://api.supabase.com/v1/projects/${ref}/database/query`;
const sql = readFileSync(sqlPath, "utf8");

const res = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
});

const body = await res.text();
if (!res.ok) {
  console.error(`FAILED (${res.status}):\n${body}`);
  process.exit(1);
}
console.log(`OK — ${sqlPath} applied.\n${body || "(no rows returned)"}`);
