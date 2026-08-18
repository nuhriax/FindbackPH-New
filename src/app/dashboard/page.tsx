import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { CATEGORY_LABELS } from "@/lib/validation";
import { Sparkles, Bookmark } from "lucide-react";

type DashboardMatch = {
  id: string;
  score: number | null;
  dismissed: boolean;
  lost_item_id: string;
  found_item_id: string;
  found_items:
    | {
        id: string;
        title: string;
        city: string;
        province: string;
        category: string;
      }[]
    | null;
};

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: lostItems = [] }, { data: foundItems = [] }, { data: savedItems = [] }] =
    await Promise.all([
      supabase
        .from("lost_items")
        .select("id, title, category, status, date_lost")
        .eq("reporter_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("found_items")
        .select("id, title, category, status, date_found")
        .eq("reporter_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("saved_items")
        .select("id, lost_item_id, found_item_id, lost_items(title, status), found_items(title, status)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  // Fetch matches for the user's lost reports. Needs the lost item ids first,
  // so it runs after the Promise.all above (it can't reference lostItems inside it).
  let matches: DashboardMatch[] = [];
  const lostItemIds = (lostItems ?? []).map((i) => i.id);

  if (lostItemIds.length > 0) {
    const { data } = await supabase
      .from("matches")
      .select(
        "id, score, dismissed, lost_item_id, found_item_id, found_items(id, title, city, province, category)"
      )
      .in("lost_item_id", lostItemIds);
    matches = data ?? [];
  }

  const activeLost = (lostItems ?? []).filter((i) => i.status === "active").length ?? 0;
  const activeFound = (foundItems ?? []).filter((i) => i.status === "active").length ?? 0;
  const recovered =
    ((lostItems ?? []).filter((i) => i.status === "recovered").length ?? 0) +
    ((foundItems ?? []).filter((i) => i.status === "recovered").length ?? 0);

  const undismissedMatches = (matches ?? []).filter((m: any) => !m.dismissed);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-medium">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-slate-600">Active lost reports</p>
          <p className="mt-1 font-display text-2xl">{activeLost}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-600">Active found reports</p>
          <p className="mt-1 font-display text-2xl">{activeFound}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-600">Items recovered</p>
          <p className="mt-1 font-display text-2xl">{recovered}</p>
        </div>
      </div>

      {/* ---------------- POSSIBLE MATCHES ---------------- */}
      <div className="mt-10">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-blue-600" />
          <h2 className="font-display text-lg font-medium">Possible Matches</h2>
        </div>
        <div className="card mt-3 divide-y divide-slate-200">
          {undismissedMatches.length > 0 ? (
            undismissedMatches.map((match: any) => {
              const found = match.found_items?.[0];
              return (
                <div key={match.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm text-slate-600">
                      A found report may match one of your lost items in{" "}
                      <span className="text-navy-900">{found?.city}</span>, {found?.province}.
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Found: {found?.title} ·{" "}
                      {match.score != null ? `${Math.round(match.score * 100)}% match` : "Possible match"}
                    </p>
                  </div>
                  <Link href={`/found/${match.found_item_id}`} className="btn-secondary !py-1.5 text-xs">
                    View Possible Match
                  </Link>
                </div>
              );
            })
          ) : (
            <p className="px-5 py-6 text-sm text-slate-500">
              No possible matches yet. We&apos;ll notify you when a potential match is found.
            </p>
          )}
        </div>
      </div>

      {/* ---------------- SAVED ITEMS ---------------- */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark size={18} className="text-blue-600" />
            <h2 className="font-display text-lg font-medium">Saved Items</h2>
          </div>
          <Link href="/saved" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="card mt-3 divide-y divide-slate-200">
          {savedItems && savedItems.length > 0 ? (
            savedItems.map((saved: any) => {
              const item = saved.lost_items || saved.found_items;
              const isLost = !!saved.lost_items;
              const href = isLost ? `/lost/${saved.lost_item_id}` : `/found/${saved.found_item_id}`;
              return (
                <Link key={saved.id} href={href} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                  <p className="font-medium">{item?.title ?? "Saved item"}</p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs capitalize text-slate-700">
                    {item?.status ?? "active"}
                  </span>
                </Link>
              );
            })
          ) : (
            <p className="px-5 py-6 text-sm text-slate-500">You haven&apos;t saved any reports yet.</p>
          )}
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-medium">My lost reports</h2>
        <Link href="/report/lost" className="text-sm text-blue-600 hover:underline">
          + Report lost item
        </Link>
      </div>
      <div className="card mt-3 divide-y divide-slate-200">
        {lostItems && lostItems.length > 0 ? (
          lostItems.map((item) => (
            <Link
              key={item.id}
              href={`/lost/${item.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-slate-500">
                  {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS]} · Lost{" "}
                  {format(new Date(item.date_lost), "MMM d, yyyy")}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs capitalize text-slate-700">
                {item.status}
              </span>
            </Link>
          ))
        ) : (
          <p className="px-5 py-6 text-sm text-slate-500">You haven&apos;t reported any lost items yet.</p>
        )}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-medium">My found reports</h2>
        <Link href="/report/found" className="text-sm text-blue-600 hover:underline">
          + Report found item
        </Link>
      </div>
      <div className="card mt-3 divide-y divide-slate-200">
        {foundItems && foundItems.length > 0 ? (
          foundItems.map((item) => (
            <Link
              key={item.id}
              href={`/found/${item.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-slate-500">
                  {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS]} · Found{" "}
                  {format(new Date(item.date_found), "MMM d, yyyy")}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs capitalize text-slate-700">
                {item.status}
              </span>
            </Link>
          ))
        ) : (
          <p className="px-5 py-6 text-sm text-slate-500">You haven&apos;t reported any found items yet.</p>
        )}
      </div>
    </div>
  );
}


