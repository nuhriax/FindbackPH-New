/**
 * configure-storage.mjs
 * -----------------------------------------------------------------------------
 * One-command Supabase Storage setup for report photos (and profile avatars).
 *
 * Creates the public "item-images" bucket and its storage policies so photo
 * uploads work, and (re)-creates the public "avatars" bucket + policies used
 * for profile photos. Every statement is idempotent (`on conflict do nothing`
 * / `drop policy if exists`), so it is safe to re-run.
 *
 * Uses the Supabase Management API (same as configure-email.mjs / configure-oauth.mjs)
 * so you don't have to click through the Storage UI.
 *
 * REQUIRES (in .env.local, which is git-ignored):
 *   SUPABASE_ACCESS_TOKEN=...   a Supabase PERSONAL ACCESS TOKEN
 *                               Create at: https://supabase.com/dashboard/account/tokens
 *
 * USAGE:
 *   node scripts/configure-storage.mjs
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

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");

const ref = process.env.SUPABASE_PROJECT_REF || "llmxwvclxiiwczcnbsrt";
const token = process.env.SUPABASE_ACCESS_TOKEN || "";

const QUERY_URL = `https://api.supabase.com/v1/projects/${ref}/database/query`;

// Idempotent: creating the bucket again is a no-op; policies are dropped first.
const ITEM_IMAGES_SQL = `
-- item-images bucket (public). Safe to re-run.
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do nothing;

drop policy if exists "Public item image read" on storage.objects;
create policy "Public item image read"
  on storage.objects for select
  to public
  using (bucket_id = 'item-images');

drop policy if exists "Authenticated can insert item images" on storage.objects;
create policy "Authenticated can insert item images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'item-images');

drop policy if exists "Authenticated can update item images" on storage.objects;
create policy "Authenticated can update item images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'item-images');

drop policy if exists "Authenticated can delete item images" on storage.objects;
create policy "Authenticated can delete item images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'item-images');
`;

const AVATARS_SQL = `
-- avatars bucket (public idempotent re-create).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Public avatar read" on storage.objects;
create policy "Public avatar read"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

drop policy if exists "Avatar insert own" on storage.objects;
create policy "Avatar insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Avatar update own" on storage.objects;
create policy "Avatar update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Avatar delete own" on storage.objects;
create policy "Avatar delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
`;

function fail(msg) {
  console.error("\n[error] " + msg + "\n");
  process.exit(1);
}

/**
 * Runs raw SQL against the project via the Management API.
 * The endpoint accepts the query in the JSON body ({"query":"..."}) or as a
 * plain-text body; we try the JSON form first, then fall back to text/plain.
 */
async function runQuery(sql) {
  // Try JSON body first.
  let res = await fetch(QUERY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (res.status === 415 || res.status === 400) {
    // Retry with a plain-text body, which some API versions require.
    res = await fetch(QUERY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: sql,
    });
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    fail(`Query failed (HTTP ${res.status}): ${res.statusText} ${text}`);
  }
  return res;
}

async function main() {
  if (!token) {
    fail(
      "Missing SUPABASE_ACCESS_TOKEN (your Supabase PAT).\n" +
        "Create one at https://supabase.com/dashboard/account/tokens and add it to .env.local"
    );
  }

  console.log(`Targeting project ref: ${ref}\n`);

  console.log("Ensuring item-images bucket + policies...");
  await runQuery(ITEM_IMAGES_SQL);
  console.log("  item-images OK");

  console.log("Ensuring avatars bucket + policies...");
  await runQuery(AVATARS_SQL);
  console.log("  avatars OK");

  console.log("\nStorage setup complete. Photo uploads are now configured.");
}

main().catch((err) => fail(err?.message ?? String(err)));