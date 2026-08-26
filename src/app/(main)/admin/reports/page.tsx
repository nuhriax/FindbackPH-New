import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  updateReportStatusAction,
  deleteReportAction,
  logAdminAction,
  isAdminUser,
} from "@/lib/actions/admin";
import { format } from "date-fns";
import { CATEGORY_LABELS } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type: rawType } = await searchParams;
  const authorized = await isAdminUser();
  if (!authorized) notFound();

  const supabase = await createClient();
    const type = rawType === "found_item" ? "found_item" : "lost_item";
    const table = type === "lost_item" ? "lost_items" : "found_items";
    const dateField = type === "lost_item" ? "date_lost" : "date_found";

  const { data: items, error } = await supabase
    .from(table)
    .select("id, title, category, city, province, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching reports:", error);
  }

  return (
    <div className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="section-eyebrow">Moderation queue</span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-900">
              {type === "lost_item" ? "Lost" : "Found"} Reports
            </h1>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/reports?type=lost_item"
              className={`btn-secondary !py-2 ${type === "lost_item" ? "!border-electric-500/50" : ""}`}
            >
              Lost
            </Link>
            <Link
              href="/admin/reports?type=found_item"
              className={`btn-secondary !py-2 ${type === "found_item" ? "!border-electric-500/50" : ""}`}
            >
              Found
            </Link>
            <Link href="/admin" className="btn-ghost">
              Back
            </Link>
          </div>
        </div>

        {!items || items.length === 0 ? (
          <div className="mt-8 card p-10 text-center">
            <p className="font-display text-lg font-semibold text-navy-900">No {type} reports found</p>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {items.map((item: any) => (
              <div key={item.id} className="card card-hover flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/${type}/${item.id}`} className="font-medium text-navy-900 transition-colors hover:text-blue-700">
                    {item.title}
                  </Link>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS]} ·{" "}
                    {item.city}, {item.province} ·{" "}
                    {format(new Date(item.created_at), "MMM d, yyyy")}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-ice-50 px-2.5 py-0.5 text-xs capitalize text-slate-600 ring-1 ring-slate-200">
                    {item.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Hide */}
                  {(item.status === "active" || item.status === "matched") && (
                    <form
                      action={async () => {
                        "use server";
                        await updateReportStatusAction(type, item.id, "removed");
                        await logAdminAction("hide_report", type, item.id);
                      }}
                    >
                      <button type="submit" className="btn-ghost !text-amber-700">
                        Hide
                      </button>
                    </form>
                  )}
                  {item.status === "removed" && (
                    <form
                      action={async () => {
                        "use server";
                        await updateReportStatusAction(type, item.id, "active");
                        await logAdminAction("restore_report", type, item.id);
                      }}
                    >
                      <button type="submit" className="btn-ghost !text-emerald-700">
                        Restore
                      </button>
                    </form>
                  )}
                  <form
                    action={async () => {
                      "use server";
                      await deleteReportAction(type, item.id);
                      await logAdminAction("delete_report", type, item.id);
                    }}
                  >
                    <button type="submit" className="btn-ghost !text-red-600">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Likely duplicate titles in the current page of results */}
        <PotentialDuplicates type={type} items={(items ?? []) as any[]} />
      </div>
    </div>
  );
}

function PotentialDuplicates({
  type,
  items,
}: {
  type: string;
  items: {
    id: string;
    title: string;
    status: string;
    created_at: string;
  }[];
}) {
  const norm = (t: string) => t.trim().toLowerCase().replace(/\s+/g, " ");
  const groups = new Map<string, typeof items>();
  for (const it of items) {
    const key = norm(it.title);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), it]);
  }
  const dups = [...groups.values()].filter((g) => g.length > 1);
  if (dups.length === 0) return null;

  const basePath = type === "lost_item" ? "lost" : "found";

  return (
    <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
      <h2 className="font-display text-lg font-semibold text-navy-900">
        Possible duplicate titles ({dups.length})
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Reports sharing the same title in the current view — worth a quick
        review before approving.
      </p>
      <div className="mt-4 space-y-3">
        {dups.map((g) => (
          <div
            key={g[0].id}
            className="rounded-xl border border-amber-200/70 bg-white px-4 py-3"
          >
            <p className="text-sm font-semibold text-navy-900">{g[0].title}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {g.map((it) => (
                <Link
                  key={it.id}
                  href={`/${basePath}/${it.id}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                >
                  {it.status} · {format(new Date(it.created_at), "MMM d")}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



