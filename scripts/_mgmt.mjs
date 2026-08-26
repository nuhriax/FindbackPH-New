/**
 * FindBack PH — Supabase Management API SQL runner (fills the approved,
 * non-destructive security changes; the dedicated migration script kept separate).
 */
import { readFileSync, existsSync } from "node:fs";
import { writeFileSync } from "node:fs";

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

const REF = process.env.SUPABASE_PROJECT_REF || "llmxwvclxiiwczcnbsrt";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN || "";
if (!TOKEN) {
  console.error("Missing SUPABASE_ACCESS_TOKEN in .env.local");
  process.exit(1);
}

const API = `https://api.supabase.com/v1/projects/${REF}/database/query`;
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
};

/** Run a single SQL statement; print nothing about the token. */
async function run(label, sql, { allowError = false } = {}) {
  const res = await fetch(API, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok && !allowError) {
    throw new Error(`${label}: HTTP ${res.status}: ${text.slice(0, 400)}`);
  }
  console.log(`\n===== ${label} =====`);
  if (Array.isArray(json)) {
    console.log(JSON.stringify(json, null, 2));
  } else if (json && json.type === "DESCRIBE") {
    console.log(JSON.stringify(json, null, 2));
  } else {
    // Result sets come back as a table-ish array; print a compact version.
    const rows = json ?? text;
    const s = typeof rows === "string" ? rows : JSON.stringify(rows, null, 2);
    console.log(s.slice(0, 4000));
  }
  return json;
}

export { run, REF };