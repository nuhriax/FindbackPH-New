import { createClient } from "@/lib/supabase/server";
import { ItemCard } from "@/components/item-card";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validation";
import { format } from "date-fns";
import Link from "next/link";
import { getImagePublicUrl } from "@/lib/storage";

export default async function LostItemsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; city?: string };
}) {
  const supabase = createClient();

  let query = supabase
    .from("lost_items")
    .select("id, title, category, city, province, date_lost, description")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30);

  if (searchParams.q) {
    query = query.textSearch("search_vector", searchParams.q, { type: "websearch" });
  }
  if (searchParams.category) {
    query = query.eq("category", searchParams.category);
  }
  if (searchParams.city) {
    query = query.ilike("city", `%${searchParams.city}%`);
  }

  const { data: items, error } = await query;

  // Fetch the first image for each item
  const itemIds = items?.map((i) => i.id) ?? [];
  let imageMap: Record<string, string> = {};
  if (itemIds.length > 0) {
    const { data: images } = await supabase
      .from("item_images")
      .select("lost_item_id, storage_path")
      .in("lost_item_id", itemIds)
      .eq("position", 0);

    for (const img of images ?? []) {
      imageMap[img.lost_item_id!] = getImagePublicUrl(img.storage_path);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Lost Items</h1>
          <p className="mt-1 text-sm text-slate-400">Reports from people looking for their belongings.</p>
        </div>
        <Link href="/report/lost" className="btn-primary">Report a lost item</Link>
      </div>

      <form className="card mt-6 grid gap-3 p-4 sm:grid-cols-4">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search lost items…"
          className="input sm:col-span-2"
        />
        <select name="category" defaultValue={searchParams.category ?? ""} className="input">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
        <input name="city" defaultValue={searchParams.city} placeholder="City" className="input" />
        <button type="submit" className="btn-secondary sm:col-span-4">Apply filters</button>
      </form>

      {error && (
        <p className="mt-8 text-sm text-red-400">
          We couldn&apos;t load lost items right now. Please try again shortly.
        </p>
      )}

      {!error && items && items.length === 0 && (
        <div className="card mt-8 p-10 text-center">
          <p className="text-slate-300">No lost items found.</p>
          <p className="mt-1 text-sm text-slate-500">Try adjusting your filters, or check back later.</p>
        </div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items?.map((item) => (
          <ItemCard
            key={item.id}
            href={`/lost/${item.id}`}
            title={item.title}
            category={item.category}
            city={item.city}
            province={item.province}
            date={format(new Date(item.date_lost), "MMM d, yyyy")}
            description={item.description}
            kind="lost"
            imageUrl={imageMap[item.id]}
          />
        ))}
      </div>
    </div>
  );
}
