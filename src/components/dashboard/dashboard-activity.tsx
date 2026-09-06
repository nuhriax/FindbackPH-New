import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bell, HeartHandshake, MessageCircle, PackageCheck } from "lucide-react";

function activityIcon(type: string) {
  if (type === "possible_match") return { Icon: PackageCheck, cls: "border-emerald-200 bg-emerald-50 text-emerald-600" };
  if (type === "item_returned") return { Icon: HeartHandshake, cls: "border-blue-200 bg-blue-50 text-blue-600" };
  if (type === "new_message") return { Icon: MessageCircle, cls: "border-violet-200 bg-violet-50 text-violet-600" };
  return { Icon: Bell, cls: "border-blue-200 bg-blue-50 text-blue-600" };
}

export function DashboardActivity({ notifications }: { notifications: any[] }) {
  const recent = notifications.slice(0, 5);

  if (recent.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-soft backdrop-blur-md">
      <h2 className="font-display text-sm font-semibold text-navy-900">Recent Activity</h2>
      <div className="mt-3 divide-y divide-slate-100">
        {recent.map((n) => {
          const { Icon, cls } = activityIcon(n.type);
          const timeLabel = n.created_at
            ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true })
            : "";
          return (
            <div key={n.id} className="flex items-start gap-3 py-2.5">
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${cls}`}>
                <Icon size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-navy-900">{n.title}</p>
                {n.message && (
                  <p className="mt-0.5 truncate text-sm text-slate-500">{n.message}</p>
                )}
                {timeLabel && (
                  <p className="mt-0.5 text-xs text-slate-400">{timeLabel}</p>
                )}
              </div>
              {!n.read && (
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
              )}
            </div>
          );
        })}
      </div>
      {notifications.length > 5 && (
        <Link
          href="/notifications"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          View all notifications
        </Link>
      )}
    </div>
  );
}