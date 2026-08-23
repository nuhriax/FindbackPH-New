/**
 * check-storage.mjs
 * -----------------------------------------------------------------------------
 * Verifies that the "item-images" and "avatars" Storage buckets exist and that
 * their policies are in place. Read-only; safe to run any time.
 *
 * USAGE:  node scripts/check-storage.mjs
 * -----------------------------------------------------------------------------
 */
import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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

const ref = process.env.SUPABASE_PROJECT_REF || "llmxwvclxiiwczcnbsrt";
const token = process.env.SUPABASE_ACCESS_TOKEN || "";
const QUERY_URL = `https://api.supabase.com/v1/projects/${ref}/database/query`;

async function runQuery(sql) {
  let res = await fetch(QUERY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (res.status === 415 || res.status === 400) {
    res = await fetch(QUERY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: sql,
    });
  }
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

const __dir = dirname(fileURLToPath(import.meta.url));

if (!token) {
  console.error("[error] Missing SUPABASE_ACCESS_TOKEN in .env.local");
  process.exit(1);
}

const buckets = await runQuery("select id, name, public from storage.buckets order by id;");
console.log("== Buckets ==");
console.log(buckets.text);

const policies = await runQuery(
  "select schemaname, tablename, policyname, cmd from pg_policies where schemaname = 'storage' order by tablename, policyname;"
);
console.log("\n== Storage policies ==");
console.log(policies.text);

const __root = join(__dir, "..");
console.log("\nDone. (script dir: " + __dir + ", project root: " + __root + ")");