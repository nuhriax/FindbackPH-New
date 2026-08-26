import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS } from "@/lib/validation";
import { ReportActions } from "@/components/dashboard/report-actions";
import { Eye, ListChecks, Pencil, Plus } from "lucide-react";
import type { ItemStatus } from "@/types/database";

export const metadata = {
  title: "My Reports — FindBack PH",
  description: "Review and manage all of the lost and found reports you've created.",
};

type ReportRow = {
  id: string;
  title: string;
  category: string;
  city: string | null;
  province: string | null;
  status: ItemStatus;
  created_at: string | null;
  kind: "lost" | "found";
};

const KIND_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Lost", value: "lost" },
  { label: "Found", value: "found" },
];

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Returned", value: "recovered" },
  { label: "Archived", value: "archived" },
];

export default async function MyReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const kind = KIND_OPTIONS.some((o) => o.value === sp.kind) ? sp.kind! : "all";
  const status = STATUS_OPTIONS.some((o) => o.value === sp.status) ? sp.status! : "all";
  const statusFilter = status === "all" ? undefined : status;

  const lostBase = supabase
    .from("lost_items")
    .select("id,title,category,city,province,status,created_at")
    .eq("reporter_id", user.id)
    .order("created_at", { ascending: false });
  const foundBase = supabase
    .from("found_items")
    .select("id,title,category,city,province,status,created_at")
    .eq("reporter_id", user.id)
    .order("created_at", { ascending: false });

  const lostQ = statusFilter ? lostBase.eq("status", statusFilter) : lostBase;
  const foundQ = statusFilter ? foundBase.eq("status", statusFilter) : foundBase;

  const queries: PromiseLike<{ data: any[] | null }>[] = [];
  if (kind !== "found") queries.push(lostQ);
  if (kind !== "lost") queries.push(foundQ);

  const results = await Promise.all(queries);

  const reports: ReportRow[] = [];
  results.forEach((res, i) => {
    const isLost = kind === "all" ? i === 0 : kind === "lost";
    for (const item of res.data ?? []) {
      reports.push({
        id: item.id,
        title: item.title,
        category: item.category,
        city: item.city,
        province: item.province,
        status: item.status,
        created_at: item.created_at,
        kind: isLost ? "lost" : "found",
      });
    }
  });

  const totalReports = reports.length;
  const activeCount = reports.filter((r) => r.status === "active" || r.status === "matched").length;
  const recoveredCount = reports.filter((r) => r.status === "recovered").length;
  const archivedCount = reports.filter((r) => r.status === "archived").length;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="section-eyebrow">Your reports</span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-navy-900">
            My Reports
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Track, update, or close out the reports you&apos;ve published.
          </p>
        </div>
        <Link href="/report/lost" className="btn-primary shrink-0">
          <Plus size={16} />
          New report
        </Link>
      </div>

      {/* Summary stats */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile label="Total reports" value={totalReports} tone="blue" />
        <SummaryTile label="Active" value={activeCount} tone="sunrise" />
        <SummaryTile label="Returned" value={recoveredCount} tone="emerald" />
        <SummaryTile label="Archived" value={archivedCount} tone="slate" />
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {KIND_OPTIONS.map((o) => (
          <FilterChip
            key={o.value}
            label={o.label}
            active={kind === o.value}
            href={`/dashboard/reports?kind=${o.value}&status=${status}`}
          />
        ))}
        <span aria-hidden className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
        {STATUS_OPTIONS.map((o) => (
          <FilterChip
            key={o.value}
            label={o.label}
            active={status === o.value}
            href={`/dashboard/reports?kind=${kind}&status=${o.value}`}
          />
        ))}
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-card border border-slate-200/70 bg-white/70 shadow-soft">
        {reports.length === 0 ? (
          <EmptyReports />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead className="border-b border-slate-200/70 bg-slate-50/70">
                <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Report</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Location</th>
                  <th className="hidden px-4 py-3 md:table-cell">Created</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <ReportRow key={`${report.kind}-${report.id}`} report={report} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  function FilterChip({ label, active, href }: { label: string; active: boolean; href: string }) {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={
          active
            ? "rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-sm font-medium text-blue-700"
            : "rounded-full border border-transparent px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-white/70 hover:text-blue-700"
        }
      >
        {label}
      </Link>
    );
  }

  function EmptyReports() {
    return (
      <div className="px-6 py-16 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
          <ListChecks size={20} />
        </span>
        <h3 className="mt-4 font-display text-lg font-semibold text-navy-900">No reports here yet</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
          Reports you create for lost or found items will appear here so you can manage them easily.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/report/lost" className="btn-primary">
            <Plus size={15} />
            Report a lost item
          </Link>
          <Link href="/report/found" className="btn-secondary">
            Report a found item
          </Link>
        </div>
      </div>
    );
  }

  function ReportRow({ report }: { report: ReportRow }) {
    const href = report.kind === "lost" ? `/lost/${report.id}` : `/found/${report.id}`;
    return (
      <tr className="align-middle transition-colors hover:bg-white/70">
        <td className="px-4 py-3">
          <span
            className={
              report.kind === "lost"
                ? "inline-flex rounded-full border border-sunrise-200 bg-sunrise-50 px-2 py-0.5 text-[11px] font-semibold text-sunrise-700"
                : "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
            }
          >
            {report.kind === "lost" ? "Lost" : "Found"}
          </span>
        </td>
        <td className="px-4 py-3">
          <Link href={href} className="font-medium text-navy-900 hover:text-blue-700">
            {report.title}
          </Link>
          <span className="mt-0.5 hidden text-xs text-slate-500 sm:block">
            {CATEGORY_LABELS[report.category as keyof typeof CATEGORY_LABELS] ?? report.category}
          </span>
        </td>
        <td className="hidden px-4 py-3 text-sm text-slate-600 sm:table-cell">
          {[report.city, report.province].filter(Boolean).join(", ") || "—"}
        </td>
        <td className="hidden px-4 py-3 text-xs text-slate-500 md:table-cell">
          {report.created_at ? formatDate(report.created_at) : "—"}
        </td>
        <td className="px-4 py-3">
          <StatusPill status={report.status} />
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Link href={href} className="btn-ghost !px-2.5 !py-1.5 text-xs">
              <Eye size={14} />
              View
            </Link>
            <Link
              href={`/dashboard/reports/${report.id}/edit`}
              className="btn-ghost !px-2.5 !py-1.5 text-xs"
            >
              <Pencil size={14} />
              Edit
            </Link>
            <ReportActions
              itemType={report.kind === "lost" ? "lost_item" : "found_item"}
              itemId={report.id}
              status={report.status}
            />
          </div>
        </td>
      </tr>
    );
  }
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const STATUS_TONES: Record<string, string> = {
  active: "border-blue-200 bg-blue-50 text-blue-700",
  matched: "border-amber-200 bg-amber-50 text-amber-700",
  recovered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  archived: "border-slate-200 bg-slate-100 text-slate-600",
  removed: "border-red-200 bg-red-50 text-red-600",
};

function StatusPill({ status }: { status: ItemStatus }) {
  const tone = STATUS_TONES[status] ?? "border-slate-200 bg-slate-100 text-slate-700";
  const label = status === "recovered" ? "Returned" : status;
  return <span className={`rounded-full border px-2 py-0.5 text-xs capitalize ${tone}`}>{label}</span>;
}

const SUMMARY_TONES: Record<string, string> = {
  blue: "border-blue-200 bg-blue-50 text-blue-600",
  sunrise: "border-sunrise-200 bg-sunrise-50 text-sunrise-600",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-600",
  slate: "border-slate-200 bg-slate-100 text-slate-600",
};

function SummaryTile({ label, value, tone }: { label: string; value: number; tone: keyof typeof SUMMARY_TONES }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${SUMMARY_TONES[tone]}`}>
        <span className="font-display text-sm font-bold tabular-nums">{value}</span>
      </span>
      <div>
        <p className="text-sm font-semibold text-navy-900">{label}</p>
        <p className="text-xs text-slate-500">
          {label === "Total reports"
            ? "across lost & found"
            : label === "Active"
              ? "currently being matched"
              : label === "Returned"
                ? "successfully reunited"
                : "stored for later"}
        </p>
      </div>
    </div>
  );
}
