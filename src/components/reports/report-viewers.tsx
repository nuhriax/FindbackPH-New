import Link from "next/link";
import { Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/**
 * "Who viewed this report" — owner-only panel.
 *
 * Data comes from the item_views ledger via the owner-checked RPC
 * `get_item_viewers` (see supabase/107-item-viewers.sql). Signed-in viewers
 * resolve to their profile; anonymous browsers show as "Anonymous visitor"
 * since no identity exists to display. Only first-time views are recorded.
 */

export type ReportViewer = {
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  isMember: boolean;
  viewedAt: string;
};

export function ReportViewers({ viewers }: { viewers: ReportViewer[] }) {
  if (viewers.length === 0) {
    return (
      <section
        aria-label="Report viewers"
        className="rounded-2xl border border-slate-200 bg-white p-4"
      >
        <header className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <Eye size={15} />
          </span>
          <h2 className="text-sm font-bold text-slate-900">
            Who viewed this report
          </h2>
        </header>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          No views recorded yet. When people open this report, you&apos;ll see
          who stopped by — one entry per person, even if they come back.
        </p>
      </section>
    );
  }

  const memberCount = viewers.filter((v) => v.isMember).length;
  const anonCount = viewers.length - memberCount;

  return (
    <section
      aria-label="Report viewers"
      className="rounded-2xl border border-slate-200 bg-white p-4"
    >
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric-50 text-electric-600">
            <Eye size={15} />
          </span>
          <h2 className="text-sm font-bold text-slate-900">
            Who viewed this report
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          {viewers.length}
        </span>
      </header>

      <ul className="mt-3 flex flex-col gap-2">
        {viewers.map((viewer, i) => {
          const initial = viewer.displayName?.[0]?.toUpperCase() ?? "?";

          return (
            <li
              key={`${viewer.username ?? "anon"}-${viewer.viewedAt}-${i}`}
              className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2"
            >
              {viewer.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={viewer.avatarUrl}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  className={
                    viewer.isMember
                      ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-electric-500 text-xs font-semibold text-white"
                      : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-300 text-xs font-semibold text-white"
                  }
                >
                  {viewer.isMember ? initial : "?"}
                </span>
              )}

              <div className="min-w-0 flex-1">
                {viewer.isMember && viewer.username ? (
                  <Link
                    href={`/member/${viewer.username}`}
                    className="block truncate text-sm font-semibold text-slate-900 transition-colors hover:text-electric-700 hover:underline"
                  >
                    {viewer.displayName || viewer.username}
                  </Link>
                ) : (
                  <p className="truncate text-sm font-semibold text-slate-600">
                    {viewer.displayName || "Anonymous visitor"}
                  </p>
                )}
                <p className="text-[11px] text-slate-400">
                  {viewer.isMember ? "Member" : "Signed-out visitor"} · viewed{" "}
                  {formatDistanceToNow(new Date(viewer.viewedAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[11px] leading-4 text-slate-400">
        Each person is counted once, no matter how many times they return.
        {anonCount > 0
          ? ` ${anonCount} ${anonCount === 1 ? "visitor" : "visitors"} browsed without an account, so FindBack can't show their name.`
          : ""}
      </p>
    </section>
  );
}
