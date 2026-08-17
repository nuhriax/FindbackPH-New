import { createClient } from "@/lib/supabase/server";
import { ItemCard } from "@/components/item-card";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validation";
import { format } from "date-fns";
import { Search } from "lucide-react";

export const metadata = {
  title: "Search — FindBack PH",
  description: "Search lost & found reports on FindBack PH.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; city?: string; category?: string };
}) {
  const supabase = createClient();
  const { q, city, category } = searchParams;

  function applyFilters(query: any, _dateColumn: string) {
    if (q) query = query.textSearch("search_vector", q, { type: "websearch" });
    if (category) query = query.eq("category", category);
    if (city) query = query.ilike("city", `%${city}%`);
    return query;
  }

  let lostQuery = supabase
    .from("lost_items")
    .select("id, title, category, city, province, date_lost, description")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30);
  let foundQuery = supabase
    .from("found_items")
    .select("id, title, category, city, province, date_found, description")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30);

  const hasFilters = Boolean(q || city || category);
  if (hasFilters) {
    lostQuery = applyFilters(lostQuery, "date_lost");
    foundQuery = applyFilters(foundQuery, "date_found");
  }

  const [lostRes, foundRes] = await Promise.all([lostQuery, foundQuery]);
  const lostItems = lostRes.data ?? [];
  const foundItems = foundRes.data ?? [];
  const error = lostRes.error || foundRes.error;

  const activeCategory = category && CATEGORIES.includes(category as any) ? category : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Looking for <span className="gradient-text">something?</span>
        </h1>
        <p className="mt-3 text-lg text-ink-secondary">
          Search the FindBack PH community for lost and found reports.
        </p>
      </div>

      <form
        action="/search"
        className="mx-auto mt-10 flex max-w-3xl flex-col gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 backdrop-blur-md sm:flex-row sm:items-center sm:gap-1.5"
      >
        <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5">
          <Search size={16} className="shrink-0 text-electric-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Item — “wallet”, “iPhone”…"
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5">
          <Search size={16} className="shrink-0 text-electric-400" />
          <input
            name="city"
            defaultValue={city}
            placeholder="Location"
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
        </div>
        <select
          name="category"
          defaultValue={activeCategory ?? ""}
          className="rounded-xl border border-white/10 bg-navy-900 px-3 py-2.5 text-sm text-slate-300 focus:outline-none [&>option]:bg-navy-900"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary !px-5 !py-2.5 text-sm">
          Search
        </button>
      </form>

      {error ? (
        <p className="mt-14 text-center text-sm text-red-400">
          Something went wrong while searching. Your report is safe — please try again.
        </p>
      ) : (
        <>
          <SearchGroup
            title="Found items"
            subtitle="Items reported by people who found something — could one of these be yours?"
            items={foundItems as any[]}
            hrefPrefix="/found"
            dateKey="date_found"
            empty="No found items match your search yet."
          />
          <SearchGroup
            title="Lost items"
            subtitle="Reports from people looking for their belongings."
            items={lostItems as any[]}
            hrefPrefix="/lost"
            dateKey="date_lost"
            empty="No lost items match your search yet."
          />
        </>
      )}
    </div>
  );
}

/* ---------------- Search group ---------------- */
function SearchGroup({
  title,
  subtitle,
  items,
  hrefPrefix,
  dateKey,
  empty,
}: {
  title: string;
  subtitle: string;
  items: any[];
  hrefPrefix: string;
  dateKey: string;
  empty: string;
}) {
  return (
    <section className="mt-16">
      <h2 className="font-display text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm text-ink-secondary">{subtitle}</p>

      {items.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="text-slate-300">{empty}</p>
          <p className="mt-1 text-sm text-slate-500">
            Try adjusting your search, or browse all categories.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              href={`${hrefPrefix}/${item.id}`}
              title={item.title}
              category={item.category}
              city={item.city}
              province={item.province}
              date={format(new Date(item[dateKey]), "MMM d, yyyy")}
              description={item.description}
              kind={hrefPrefix === "/lost" ? "lost" : "found"}
            />
          ))}
        </div>
      )}
    </section>
  );
}
