import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Flag, PackageCheck, PackageX, Users, AlertCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { isAdminUser } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const authorized = await isAdminUser();
  if (!authorized) notFound();

  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: activeLost },
    { count: activeFound },
    { count: recoveredItems },
    { count: pendingFlags },
    { count: pendingUserFlags },
    { count: suspendedUsers },
    { data: recentFlags },
    { data: recentReports },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("lost_items").select("*", { count: "exact", head: true }).in("status", ["active", "matched"]),
    supabase.from("found_items").select("*", { count: "exact", head: true }).in("status", ["active", "matched"]),
    supabase.from("lost_items").select("*", { count: "exact", head: true }).eq("status", "recovered"),
    supabase.from("report_flags").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("user_flags").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_suspended", true),
    supabase
      .from("report_flags")
      .select("id, reason, status, created_at, reporter_id, lost_item_id, found_item_id, profiles(username, first_name, last_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("lost_items")
      .select("id, title, category, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalPendingFlags = (pendingFlags ?? 0) + (pendingUserFlags ?? 0);

  const stats = [
    { label: "Total users", value: totalUsers ?? 0, icon: Users, tone: "blue" as const, href: "/admin/users" },
    { label: "Active lost", value: activeLost ?? 0, icon: PackageX, tone: "sunrise" as const, href: "/admin/reports?type=lost_item" },
    { label: "Active found", value: activeFound ?? 0, icon: PackageCheck, tone: "emerald" as const, href: "/admin/reports?type=found_item" },
    { label: "Recovered", value: recoveredItems ?? 0, icon: ArrowRight, tone: "leaf" as const, href: "/admin/reports" },
    { label: "Pending flags", value: totalPendingFlags, icon: Flag, tone: "amber" as const, href: "/admin/flags" },
    { label: "Suspended", value: suspendedUsers ?? 0, icon: AlertCircle, tone: "red" as const, href: "/admin/users" },
  ];

  return (
    <div>
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="card group relative block overflow-hidden p-4 transition hover:-translate-y-0.5 hover:border-electric-200 hover:shadow-lg"
          >
            <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${ADMIN_ACCENT[s.tone]}`} />
            <div className="relative flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-slate-600">{s.label}</p>
                <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-navy-900">{(s.value as number).toLocaleString()}</p>
              </div>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${ADMIN_TONES[s.tone]} group-hover:scale-105`}>
                <s.icon size={18} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Needs Attention */}
      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-soft backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-600" />
            <h2 className="font-display text-sm font-semibold text-navy-900">Needs Attention</h2>
          </div>
          <Link href="/admin/flags" className="text-xs font-medium text-electric-600 hover:text-electric-700">
            View all →
          </Link>
        </div>

        {recentFlags && recentFlags.length > 0 ? (
          <div className="mt-3 divide-y divide-slate-100">
            {recentFlags.map((flag: any) => {
              const reporter = flag.profiles;
              const reporterName = reporter
                ? `${reporter.first_name ?? ""} ${reporter.last_name ?? ""}`.trim() || reporter.username
                : "Unknown";
              return (
                <div key={flag.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-navy-900 capitalize">
                      {flag.reason?.replace(/_/g, " ") ?? "Flag"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      By {reporterName} · {format(new Date(flag.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Link href="/admin/flags" className="btn-secondary !py-1.5 text-xs">
                    Review
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white/50 p-4 text-center">
            <p className="text-sm text-slate-500">No pending flags to review.</p>
          </div>
        )}
      </div>

      {/* Recent Reports */}
      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-soft backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-electric-600" />
            <h2 className="font-display text-sm font-semibold text-navy-900">Recent Reports</h2>
          </div>
          <Link href="/admin/reports" className="text-xs font-medium text-electric-600 hover:text-electric-700">
            View all →
          </Link>
        </div>

        {recentReports && recentReports.length > 0 ? (
          <div className="mt-3 divide-y divide-slate-100">
            {recentReports.map((report: any) => (
              <div key={report.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-navy-900">{report.title}</p>
                  <p className="truncate text-xs text-slate-500">
                    {report.category} · {format(new Date(report.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs capitalize ${
                  report.status === "active"
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : report.status === "recovered"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-100 text-slate-600"
                }`}>
                  {report.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white/50 p-4 text-center">
            <p className="text-sm text-slate-500">No reports yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const ADMIN_TONES: Record<string, string> = {
  blue: "border-blue-200 bg-blue-50 text-blue-600",
  sunrise: "border-sunrise-200 bg-sunrise-50 text-sunrise-600",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-600",
  leaf: "border-leaf-200 bg-leaf-50 text-leaf-600",
  amber: "border-amber-200 bg-amber-50 text-amber-600",
  red: "border-red-200 bg-red-50 text-red-600",
};

const ADMIN_ACCENT: Record<string, string> = {
  blue: "bg-blue-200",
  sunrise: "bg-sunrise-200",
  emerald: "bg-emerald-200",
  leaf: "bg-leaf-200",
  amber: "bg-amber-200",
  red: "bg-red-200",
};