import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/validation";
import { ChevronRight, MapPin, PackageCheck, PackageX } from "lucide-react";
import type { ItemStatus } from "@/types/database";

type ReportItem = {
  id: string;
  title: string;
  category: string;
  status: ItemStatus | string;
  city: string | null;
  province: string | null;
  created_at: string;
  kind: "lost" | "found";
};

const STATUS_TONES: Record<string, string> = {
  active: "border-blue-200 bg-blue-50 text-blue-700",
  matched: "border-amber-200 bg-amber-50 text-amber-700",
  recovered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  archived: "border-slate-200 bg-slate-100 text-slate-600",
  removed: "border-red-200 bg-red-50 text-red-600",
};

function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONES[status] ?? "border-slate-200 bg-slate-100 text-slate-700";
  const label = status === "recovered" ? "Returned" : status;
  return <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs capitalize ${tone}`}>{label}</span>;
}

export function DashboardMyReports({
  lostItems,
  foundItems,
}: {
  lostItems: any[] | null;
  foundItems: any[] | null;
}) {
  const allReports: ReportItem[] = [
    ...(lostItems ?? []).map((i) => ({
      id: i.id,
      title: i.title,
      category: i.category,
      status: i.status,
      city: i.city,
      province: i.province,
      created_at: i.created_at,
      kind: "lost" as const,
    })),
    ...(foundItems ?? []).map((i) => ({
      id: i.id,
      title: i.title,
      category: i.category,
      status: i.status,
      city: i.city,
      province: i.province,
      created_at: i.created_at,
      kind: "found" as const,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const recentReports = allReports.slice(0, 5);

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-soft backdrop-blur-md">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-navy-900">My Reports</h2>
        <Link
          href="/dashboard/reports"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          View all reports
          <ChevronRight size={14} />
        </Link>
      </div>

      {recentReports.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white/50 p-5 text-center">
          <p className="text-sm text-slate-500">You haven&apos;t created any reports yet.</p>
          <Link href="/report/lost" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600">
            Report your first item
          </Link>
        </div>
      ) : (
        <div className="mt-3 divide-y divide-slate-100">
          {recentReports.map((report) => {
            const href = report.kind === "lost" ? `/lost/${report.id}` : `/found/${report.id}`;
            const location = [report.city, report.province].filter(Boolean).join(", ") || "—";
            const category = CATEGORY_LABELS[report.category as keyof typeof CATEGORY_LABELS] ?? report.category;
            return (
              <div key={`${report.kind}-${report.id}`} className="flex items-center gap-3 py-2.5">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  report.kind === "lost"
                    ? "border border-sunrise-200 bg-sunrise-50 text-sunrise-600"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-600"
                }`}>
                  {report.kind === "lost" ? <PackageX size={14} /> : <PackageCheck size={14} />}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={href} className="truncate text-sm font-medium text-navy-900 hover:text-blue-700">
                    {report.title}
                  </Link>
                  <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                    <span>{category}</span>
                    <span className="text-slate-300">·</span>
                    <MapPin size={10} className="shrink-0" />
                    <span>{location}</span>
                  </p>
                </div>
                <StatusPill status={report.status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}