/**
 * FindBack PH — One-time migration for the item-images Storage bucket.
 * -------------------------------------------------------------------------
 * After the security migration (supabase/security-migration.sql) the bucket
 * policy requires every object to live under "<user-id>/...". This script moves
 * EXISTING flat-path images (e.g. "lost_abc….jpg") into their owner's folder
 * (e.g. "<user-id>/lost_abc….jpg") and updates the item_images rows to match.
 *
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set in .env.local
 *     (SUPABASE_URL falls back to NEXT_PUBLIC_SUPABASE_URL).
 *   - @supabase/supabase-js is already installed (dependency).
 *
 * Usage (from the project root):
 *   node scripts/migrate-item-images.mjs            # run the migration
 *   node scripts/migrate-item-images.mjs --dry-run  # only report what would move
 *
 * It is safe to re-run: paths that already start with "<uuid>/" are skipped.
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

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

const DRY_RUN = process.argv.includes("--dry-run");

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Build a map of <item_id> -> reporter_id for a given table. */
async function ownersFor(table) {
  const { data, error } = await supabase
    .from(table)
    .select("id, reporter_id");
  if (error) throw new Error(`Could not read ${table}: ${error.message}`);
  const map = {};
  for (const row of data ?? []) map[row.id] = row.reporter_id;
  return map;
}

async function main() {
  const { data: images, error } = await supabase
    .from("item_images")
    .select("id, storage_path, lost_item_id, found_item_id");
  if (error) throw new Error(`Could not read item_images: ${error.message}`);

  const lostOwners = await ownersFor("lost_items");
  const foundOwners = await ownersFor("found_items");

  const moved = [];
  let movedCount = 0;

  for (const img of images ?? []) {
    const path = img.storage_path;
    // Already scoped looks like "<uuid>/rest..." — skip.
    if (path.includes("/")) continue;

    const owner = img.lost_item_id
      ? lostOwners[img.lost_item_id]
      : img.found_item_id
        ? foundOwners[img.found_item_id]
        : null;

    if (!owner) {
      console.warn(`SKIP ${path} — no owner found for item_images id ${img.id}`);
      continue;
    }

    const newPath = `${owner}/${path}`;

    if (DRY_RUN) {
      moved.push(`${path} -> ${newPath}`);
      continue;
    }

    const { error: moveErr } = await supabase.storage
      .from("item-images")
      .move(path, newPath);

    if (moveErr) {
      console.error(`ERROR moving ${path}: ${moveErr.message}`);
      continue;
    }

    const { error: updateErr } = await supabase
      .from("item_images")
      .update({ storage_path: newPath })
      .eq("id", img.id);

    if (updateErr) {
      console.error(`ERROR updating row for ${newPath}: ${updateErr.message}`);
      continue;
    }

    // .move() already relocated the object (source path is gone).
    moved.push(`${path} -> ${newPath}`);
  }

  if (DRY_RUN) {
    console.log("\n[DRY-RUN] Would move the following (not executed):\n");
  }
  for (const line of moved) console.log(line);
  console.log(`\nTotal files ${DRY_RUN ? "to move" : "moved"}: ${moved.length}`);
  if (!DRY_RUN) console.log("Re-run with --dry-run to preview, or re-run without it to finish any failed ones.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});