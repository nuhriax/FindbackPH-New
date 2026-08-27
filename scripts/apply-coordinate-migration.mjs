/**
 * One-off helper: applies supabase/103-item-coordinates.sql to the live
 * Supabase project via the Management API and verifies the columns exist.
 * Usage: node scripts/apply-coordinate-migration.mjs
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .map((line) => line.match(/^([A-Z_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].replace(/^["']|["']$/g, "")])
);

const projectRef = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const token = env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error("No SUPABASE_ACCESS_TOKEN found in .env.local");
  process.exit(1);
}

const sql = readFileSync("supabase/103-item-coordinates.sql", "utf8");

async function runQuery(query) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );
  const body = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(body));
  return body;
}

try {
  await runQuery(sql);
  console.log("Migration applied.");

  const check = await runQuery(`
    select table_name, column_name, data_type
    from information_schema.columns
    where table_schema = 'public'
      and column_name in ('latitude', 'longitude')
      and table_name in ('lost_items', 'found_items')
    order by table_name, column_name;
  `);
  console.log(`Verification: ${check.length} coordinate columns found`);
  for (const row of check) {
    console.log(`  ${row.table_name}.${row.column_name} (${row.data_type})`);
  }
  if (check.length !== 4) {
    console.error("Expected 4 columns — verification failed!");
    process.exit(1);
  }
  console.log("All good.");
} catch (err) {
  console.error("Failed:", err.message);
  process.exit(1);
}
