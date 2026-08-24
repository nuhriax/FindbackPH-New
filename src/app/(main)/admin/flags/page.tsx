import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { reviewFlagAction, reviewUserFlagAction, isAdminUser } from "@/lib/actions/admin";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const REASON_LABELS: Record<string, string> = {
  scam: "Scam",
  fake_report: "Fake report",
  harassment: "Harassment",
  suspicious_behavior: "Suspicious behavior",
  inappropriate_content: "Inappropriate content",
  wrong_information: "Wrong information",
  impersonation: "Impersonation",
  other: "Other",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  under_review: "bg-blue-100 text-blue-800 ring-1 ring-blue-200",
  reviewed: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  resolved: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  dismissed: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  under_review: "Under review",
  reviewed: "Reviewed",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[status] ?? STATUS_STYLES.dismissed}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default async function AdminFlagsPage() {
  const authorized = await isAdminUser();
  if (!authorized) notFound();

  const supabase = createClient();
  const [{ data: flags, error }, { data: userFlags, error: userFlagsError }] = await Promise.all([
    supabase
      .from("report_flags")
      .select("*, profiles!report_flags_reporter_id_fkey(username, first_name, last_name)")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("user_flags")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (error) console.error("Error fetching flags:", error);
  if (userFlagsError) console.error("Error fetching user flags:", userFlagsError);

  const pendingCount =
    (flags?.filter((f) => f.status === "pending").length ?? 0) +
    (userFlags?.filter((f) => f.status === "pending").length ?? 0);

  return (
    <div className="py-16 lg:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="section-eyebrow">Community reports</span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-900">Report Flags</h1>
          </div>
          <Link href="/admin" className="btn-ghost">
            Back
          </Link>
        </div>

        <div className="mt-4 flex gap-2">
          <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200">
            {pendingCount} pending
          </span>
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
            {flags?.filter((f) => f.status === "under_review").length ?? 0} listings under review
          </span>
        </div>

        {!flags || flags.length === 0 ? (
          <div className="mt-8 card p-8 text-center">
            <p className="text-navy-700">No listing flags to review. You&apos;re all caught up.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {flags.map((flag: any) => {
              const reporter = flag.profiles as {
                username: string;
                first_name?: string;
                last_name?: string;
              } | null;
              const reporterName =
                (reporter &&
                  [reporter.first_name ?? "", reporter.last_name ?? ""]
                    .map((v: string) => v.trim())
                    .filter(Boolean)
                    .join(" ")) ||
                reporter?.username ||
                "unknown";
              const href =
                flag.item_type === "lost_item"
                  ? `/lost/${flag.item_id}`
                  : `/found/${flag.item_id}`;
              const open = flag.status === "pending" || flag.status === "under_review";

              return (
                <div key={flag.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-navy-900">
                          {REASON_LABELS[flag.reason] ?? flag.reason}
                        </span>
                        <StatusBadge status={flag.status} />
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        Reported by{" "}
                        <span className="text-slate-700">
                          {reporterName}
                        </span>{" "}
                        · {format(new Date(flag.created_at), "MMM d, yyyy h:mm a")}
                      </p>
                      {flag.details && (
                        <p className="mt-2 text-sm text-slate-700">{flag.details}</p>
                      )}
                      <Link href={href} className="mt-2 inline-block text-xs text-blue-600 hover:underline">
                        View {flag.item_type === "lost_item" ? "lost" : "found"} report →
                      </Link>
                    </div>

                    {open && (
                      <div className="flex flex-wrap gap-2">
                        {flag.status === "pending" && (
                          <form
                            action={async () => {
                              "use server";
                              await reviewFlagAction(flag.id, "under_review");
                            }}
                          >
                            <button type="submit" className="btn-secondary !py-2 text-xs">
                              Start review
                            </button>
                          </form>
                        )}
                        <form
                          action={async () => {
                            "use server";
                            await reviewFlagAction(flag.id, "resolved");
                          }}
                        >
                          <button type="submit" className="btn-primary !py-2 text-xs">
                            Resolve
                          </button>
                        </form>
                        <form
                          action={async () => {
                            "use server";
                            await reviewFlagAction(flag.id, "dismissed");
                          }}
                        >
                          <button type="submit" className="btn-ghost !text-slate-700">
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
        {/* ================= USER REPORTS ================= */}
        <h2 className="mt-14 font-display text-xl font-semibold tracking-tight text-navy-900">
          User reports
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Behaviour reports filed against members. Reporter identities stay private to the moderation team.
        </p>

        {!userFlags || userFlags.length === 0 ? (
          <div className="mt-4 card p-8 text-center">
            <p className="text-navy-700">No user reports to review.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {userFlags.map((uf: any) => {
              const open = uf.status === "pending" || uf.status === "under_review";
              return (
                <div key={uf.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-navy-900">
                          {REASON_LABELS[uf.reason] ?? uf.reason}
                        </span>
                        <StatusBadge status={uf.status} />
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        Filed {format(new Date(uf.created_at), "MMM d, yyyy h:mm a")}
                      </p>
                      {uf.details && (
                        <p className="mt-2 text-sm text-slate-700">{uf.details}</p>
                      )}
                    </div>

                    {open && (
                      <div className="flex flex-wrap gap-2">
                        {uf.status === "pending" && (
                          <form
                            action={async () => {
                              "use server";
                              await reviewUserFlagAction(uf.id, "under_review");
                            }}
                          >
                            <button type="submit" className="btn-secondary !py-2 text-xs">
                              Start review
                            </button>
                          </form>
                        )}
                        <form
                          action={async () => {
                            "use server";
                            await reviewUserFlagAction(uf.id, "resolved");
                          }}
                        >
                          <button type="submit" className="btn-primary !py-2 text-xs">
                            Resolve
                          </button>
                        </form>
                        <form
                          action={async () => {
                            "use server";
                            await reviewUserFlagAction(uf.id, "dismissed");
                          }}
                        >
                          <button type="submit" className="btn-ghost !text-slate-700">
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



