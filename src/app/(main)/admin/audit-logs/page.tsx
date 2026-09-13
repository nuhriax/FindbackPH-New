import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { isAdminUser } from "@/lib/actions/admin";
import { ScrollText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  const authorized = await isAdminUser();
  if (!authorized) notFound();

  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from("audit_logs")
    .select("id, action, target_type, target_id, details, created_at, admin_id, profiles(username, first_name, last_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching audit logs:", error);
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold tracking-tight text-navy-900">Activity Log</h1>
        <p className="mt-1 text-sm text-slate-500">
          Record of moderation actions taken by admin and moderator accounts.
        </p>
      </div>

      {!logs || logs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-10 text-center shadow-soft backdrop-blur-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
            <ScrollText size={20} />
          </div>
          <p className="mt-4 font-medium text-navy-900">No activity yet</p>
          <p className="mt-1 text-sm text-slate-500">Admin actions will be logged here as they occur.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/70 bg-white/70 shadow-soft backdrop-blur-md">
          {/* Scrollable on narrow screens; page itself never overflows at 320px. */}
            <div className="admin-table-scroll overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Admin</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Target</th>
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log: any) => {
                  const admin = log.profiles;
                  const adminName = admin
                    ? `${admin.first_name ?? ""} ${admin.last_name ?? ""}`.trim() || admin.username
                    : log.admin_id?.slice(0, 8) ?? "Unknown";
                  return (
                    <tr key={log.id} className="text-slate-600 hover:bg-electric-50/30">
                      <td className="px-4 py-3">
                        <span className="font-medium text-navy-900">{adminName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize">{log.action?.replace(/_/g, " ") ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {log.target_type ? (
                          <span className="capitalize">{log.target_type.replace(/_/g, " ")}</span>
                        ) : "—"}
                        {log.target_id && (
                          <span className="ml-1 text-slate-400">{log.target_id.slice(0, 8)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {format(new Date(log.created_at), "MMM d, yyyy h:mm a")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}