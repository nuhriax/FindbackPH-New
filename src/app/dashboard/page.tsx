import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { CATEGORY_LABELS } from "@/lib/validation";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: lostItems }, { data: foundItems }] = await Promise.all([
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
  ]);

  const activeLost = lostItems?.filter((i) => i.status === "active").length ?? 0;
  const activeFound = foundItems?.filter((i) => i.status === "active").length ?? 0;
  const recovered =
    (lostItems?.filter((i) => i.status === "recovered").length ?? 0) +
    (foundItems?.filter((i) => i.status === "recovered").length ?? 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-slate-400">Active lost reports</p>
          <p className="mt-1 font-display text-2xl">{activeLost}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-400">Active found reports</p>
          <p className="mt-1 font-display text-2xl">{activeFound}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-400">Items recovered</p>
          <p className="mt-1 font-display text-2xl">{recovered}</p>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-medium">My lost reports</h2>
        <Link href="/report/lost" className="text-sm text-electric-400 hover:underline">
          + Report lost item
        </Link>
      </div>
      <div className="card mt-3 divide-y divide-navy-700">
        {lostItems && lostItems.length > 0 ? (
          lostItems.map((item) => (
            <Link
              key={item.id}
              href={`/lost/${item.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-navy-700/40"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-slate-500">
                  {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS]} · Lost{" "}
                  {format(new Date(item.date_lost), "MMM d, yyyy")}
                </p>
              </div>
              <span className="rounded-full bg-navy-700 px-2.5 py-0.5 text-xs capitalize text-slate-300">
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
        <Link href="/report/found" className="text-sm text-electric-400 hover:underline">
          + Report found item
        </Link>
      </div>
      <div className="card mt-3 divide-y divide-navy-700">
        {foundItems && foundItems.length > 0 ? (
          foundItems.map((item) => (
            <Link
              key={item.id}
              href={`/found/${item.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-navy-700/40"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-slate-500">
                  {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS]} · Found{" "}
                  {format(new Date(item.date_found), "MMM d, yyyy")}
                </p>
              </div>
              <span className="rounded-full bg-navy-700 px-2.5 py-0.5 text-xs capitalize text-slate-300">
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
