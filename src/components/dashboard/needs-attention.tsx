import Link from "next/link";
import { Bell, CheckCircle2, MessageCircle, Sparkles } from "lucide-react";

type AttentionItem = {
  id: string;
  type: "match" | "notification" | "message";
  title: string;
  message?: string;
  link: string;
};

export function NeedsAttention({
  unreadNotifications,
  undismissedMatches,
  hasContent,
}: {
  unreadNotifications: any[];
  undismissedMatches: any[];
  hasContent: boolean;
}) {
  const items: AttentionItem[] = [];

  // New possible matches
  for (const match of undismissedMatches.slice(0, 2)) {
    const found = match.found_items;
    items.push({
      id: `match-${match.id}`,
      type: "match",
      title: "New possible match",
      message: found
        ? `"${found.title}" may match one of your lost reports`
        : "A new match was found for your report",
      link: `/found/${match.found_item_id}`,
    });
  }

  // Unread notifications (show up to 3)
  for (const n of unreadNotifications.slice(0, 3)) {
    items.push({
      id: `notif-${n.id}`,
      type: "notification",
      title: n.title ?? "Update",
      message: n.message,
      link: n.link ?? "/notifications",
    });
  }

  if (items.length === 0) {
    if (!hasContent) return null;
    return (
      <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={18} />
          </span>
          <div>
            <p className="font-semibold text-navy-900">You&apos;re all caught up.</p>
            <p className="text-sm text-slate-600">No actions need your attention right now.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-soft backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Bell size={16} className="text-electric-600" />
        <h2 className="font-display text-sm font-semibold text-navy-900">Needs your attention</h2>
        <span className="rounded-full bg-electric-100 px-2 py-0.5 text-xs font-semibold text-electric-700">
          {items.length}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.link}
            className="flex items-start gap-3 rounded-xl border border-slate-200/60 bg-white/80 p-3 transition-colors hover:border-electric-200 hover:bg-electric-50/30"
          >
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              item.type === "match"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-600"
                : "border border-electric-200 bg-electric-50 text-electric-600"
            }`}>
              {item.type === "match" ? <Sparkles size={14} /> : <MessageCircle size={14} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-navy-900">{item.title}</p>
              {item.message && (
                <p className="mt-0.5 truncate text-sm text-slate-600">{item.message}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}