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
  searchParams: { type?: string };
}) {
  const authorized = await isAdminUser();
  if (!authorized) notFound();

  const supabase = createClient();
  const type = searchParams.type === "found" ? "found" : "lost";
  const table = type === "lost" ? "lost_items" : "found_items";
  const dateField = type === "lost" ? "date_lost" : "date_found";

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
          <h1 className="font-display text-3xl font-bold text-white">
            {type === "lost" ? "Lost" : "Found"} Reports
          </h1>
          <div className="flex gap-2">
            <Link
              href="/admin/reports?type=lost"
              className={`btn-secondary !py-2 ${type === "lost" ? "!border-electric-500/50" : ""}`}
            >
              Lost
            </Link>
            <Link
              href="/admin/reports?type=found"
              className={`btn-secondary !py-2 ${type === "found" ? "!border-electric-500/50" : ""}`}
            >
              Found
            </Link>
            <Link href="/admin" className="btn-ghost">
              Back
            </Link>
          </div>
        </div>

        {!items || items.length === 0 ? (
          <div className="mt-8 card p-8 text-center">
            <p className="text-slate-400">No {type} reports found.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {items.map((item: any) => (
              <div key={item.id} className="card flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/${type}/${item.id}`} className="font-medium text-white hover:text-electric-400">
                    {item.title}
                  </Link>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS]} ·{" "}
                    {item.city}, {item.province} ·{" "}
                    {format(new Date(item.created_at), "MMM d, yyyy")}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-navy-700 px-2 py-0.5 text-xs capitalize text-slate-300">
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
                      <button type="submit" className="btn-ghost !text-amber-300">
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
                      <button type="submit" className="btn-ghost !text-emerald-300">
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
                    <button type="submit" className="btn-ghost !text-red-400">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}