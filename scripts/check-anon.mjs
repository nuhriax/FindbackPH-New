import fs from "node:fs";
const env = fs.readFileSync(".env.local", "utf8");
const url = (env.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)/m) || [])[1].trim();
const key = (env.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/m) || [])[1].trim();
const h = { apikey: key, Authorization: "Bearer " + key };
const t = async (name, path) => {
  try {
    const r = await fetch(url + path, { headers: h });
    const body = (await r.text()).slice(0, 160);
    console.log(name, r.status, body);
  } catch (e) { console.log(name, "ERR", e.message); }
};
await t("ANON lost_items:", "/rest/v1/lost_items?select=id,title&status=eq.active&limit=1");
await t("ANON lost distinguishing_features:", "/rest/v1/lost_items?select=distinguishing_features&limit=1");
await t("ANON private_details:", "/rest/v1/item_private_details?select=item_id&limit=1");
await t("ANON profiles.role:", "/rest/v1/profiles?select=role&limit=1");
await t("ANON profiles public:", "/rest/v1/profiles?select=username&limit=1");
await t("PUBLIC avatar bucket:", "/storage/v1/object/public/avatars/nonexistent.jpg");
await t("PUBLIC item-images bucket:", "/storage/v1/object/public/item-images/nonexistent.jpg");
