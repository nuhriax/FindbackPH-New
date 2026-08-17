import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { reviewFlagAction, isAdminUser } from "@/lib/actions/admin";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const REASON_LABELS: Record<string, string> = {
  scam: "Scam",
  fake_report: "Fake report",
  harassment: "Harassment",
  suspicious_behavior: "Suspicious behavior",
  inappropriate_content: "Inappropriate content",
  wrong_information: "Wrong information",
  other: "Other",
};

export default async function AdminFlagsPage() {
  const authorized = await isAdminUser();
  if (!authorized) notFound();

  const supabase = createClient();
  const { data: flags, error } = await supabase
    .from("report_flags")
    .select("*, profiles!report_flags_reporter_id_fkey(username)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching flags:", error);
  }

  return (
    <div className="py-16 lg:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-bold text-white">Report Flags</h1>
          <Link href="/admin" className="btn-ghost">
            Back
          </Link>
        </div>

        <div className="mt-4 flex gap-2">
          <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs text-red-300">
            {flags?.filter((f) => f.status === "pending").length ?? 0} pending
          </span>
        </div>

        {!flags || flags.length === 0 ? (
          <div className="mt-8 card p-8 text-center">
            <p className="text-slate-400">No flags to review. You're all caught up.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {flags.map((flag: any) => {
              const reporter = flag.profiles as { username: string } | null;
              const href =
                flag.item_type === "lost_item"
                  ? `/lost/${flag.item_id}`
                  : `/found/${flag.item_id}`;

              return (
                <div key={flag.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {REASON_LABELS[flag.reason] ?? flag.reason}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            flag.status === "pending"
                              ? "bg-amber-500/15 text-amber-300"
                              : "bg-emerald-500/15 text-emerald-300"
                          }`}
                        >
                          {flag.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        Reported by{" "}
                        <span className="text-slate-300">
                          @{reporter?.username ?? "unknown"}
                        </span>{" "}
                        · {format(new Date(flag.created_at), "MMM d, yyyy h:mm a")}
                      </p>
                      {flag.details && (
                        <p className="mt-2 text-sm text-slate-300">{flag.details}</p>
                      )}
                      <Link href={href} className="mt-2 inline-block text-xs text-electric-400 hover:underline">
                        View {flag.item_type === "lost_item" ? "lost" : "found"} report →
                      </Link>
                    </div>

                    {flag.status === "pending" && (
                      <div className="flex gap-2">
                        <form
                          action={reviewFlagAction.bind(null, flag.id, "reviewed")}
                        >
                          <button type="submit" className="btn-secondary !py-2 text-xs">
                            Mark reviewed
                          </button>
                        </form>
                        <form
                          action={reviewFlagAction.bind(null, flag.id, "dismissed")}
                        >
                          <button type="submit" className="btn-ghost !text-slate-400">
                            Dismiss
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}