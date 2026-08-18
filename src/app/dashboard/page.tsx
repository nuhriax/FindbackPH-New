import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { CATEGORY_LABELS } from "@/lib/validation";
import {
  Sparkles,
  Bookmark,
  PackageSearch,
  PackageCheck,
  PackageX,
  HeartHandshake,
} from "lucide-react";

type DashboardMatch = {
  id: string;
  score: number | null;
  dismissed: boolean;
  lost_item_id: string;
  found_item_id: string;
  found_items:
    | {
        id: string;
        title: string;
        city: string;
        province: string;
        category: string;
      }[]
    | null;
};

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: lostItems = [] }, { data: foundItems = [] }, { data: savedItems = [] }] =
    await Promise.all([
      supabase
        .from("lost_items")
        .select("id, title, category, status, date_lost")
        .eq("reporter_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("found_items")
        .select("id, title, category, status, date_found")
        .eq("reporter_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("saved_items")
        .select("id, lost_item_id, found_item_id, lost_items(title, status), found_items(title, status)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  // Fetch matches for the user's lost reports. Needs the lost item ids first,
  // so it runs after the Promise.all above (it can't reference lostItems inside it).
  let matches: DashboardMatch[] = [];
  const lostItemIds = (lostItems ?? []).map((i) => i.id);

  if (lostItemIds.length > 0) {
    const { data } = await supabase
      .from("matches")
      .select(
        "id, score, dismissed, lost_item_id, found_item_id, found_items(id, title, city, province, category)"
      )
      .in("lost_item_id", lostItemIds);
    matches = data ?? [];
  }

  const activeLost = (lostItems ?? []).filter((i) => i.status === "active").length ?? 0;
  const activeFound = (foundItems ?? []).filter((i) => i.status === "active").length ?? 0;
  const recovered =
    ((lostItems ?? []).filter((i) => i.status === "recovered").length ?? 0) +
    ((foundItems ?? []).filter((i) => i.status === "recovered").length ?? 0);

  const undismissedMatches = (matches ?? []).filter((m: any) => !m.dismissed);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="section-eyebrow">Your FindBack workspace</span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Track your reports, review potential matches, and pick up where you left off.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/report/lost" className="btn-secondary">
            <PackageSearch size={16} />
            Report lost
          </Link>
          <Link href="/report/found" className="btn-primary">
            <HeartHandshake size={16} />
            Report found
          </Link>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatTile icon={PackageX} tone="indigo" label="Active lost reports" value={activeLost} />
        <StatTile icon={PackageCheck} tone="emerald" label="Active found reports" value={activeFound} />
        <StatTile icon={HeartHandshake} tone="blue" label="Items recovered" value={recovered} />
      </div>

      {/* ---------------- POSSIBLE MATCHES ---------------- */}
      <section className="mt-10">
        <SectionHeader icon={Sparkles} title="Possible Matches" />
        <div className="card mt-3 divide-y divide-slate-200">
          {undismissedMatches.length > 0 ? (
            undismissedMatches.map((match: any) => {
              const found = match.found_items?.[0];
              return (
                <div key={match.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-white/70">
                  <div>
                    <p className="text-sm text-slate-600">
                      A found report may match one of your lost items in{" "}
                      <span className="font-medium text-navy-900">{found?.city}</span>, {found?.province}.
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Found: {found?.title} ·{" "}
                      {match.score != null ? `${Math.round(match.score * 100)}% match` : "Possible match"}
                    </p>
                  </div>
                  <Link href={`/found/${match.found_item_id}`} className="btn-secondary !py-1.5 text-xs">
                    View Possible Match
                  </Link>
                </div>
              );
            })
          ) : (
            <p className="px-5 py-6 text-sm text-slate-500">
              No possible matches yet. We&apos;ll notify you when a potential match is found.
            </p>
          )}
        </div>
      </section>

      {/* ---------------- SAVED ITEMS ---------------- */}
      <section className="mt-10">
        <SectionHeader icon={Bookmark} title="Saved Items" actionHref="/saved" actionLabel="View all" />
        <div className="card mt-3 divide-y divide-slate-200">
          {savedItems && savedItems.length > 0 ? (
            savedItems.map((saved: any) => {
              const item = saved.lost_items || saved.found_items;
              const isLost = !!saved.lost_items;
              const href = isLost ? `/lost/${saved.lost_item_id}` : `/found/${saved.found_item_id}`;
              return (
                <Link
                  key={saved.id}
                  href={href}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-white/70"
                >
                  <p className="font-medium text-navy-900">{item?.title ?? "Saved item"}</p>
                  <StatusPill status={item?.status ?? "active"} />
                </Link>
              );
            })
          ) : (
            <p className="px-5 py-6 text-sm text-slate-500">You haven&apos;t saved any reports yet.</p>
          )}
        </div>
      </section>

      {/* ---------------- MY LOST REPORTS ---------------- */}
      <section className="mt-10">
        <SectionHeader icon={PackageX} title="My lost reports" actionHref="/report/lost" actionLabel="Report lost item" />
        <div className="card mt-3 divide-y divide-slate-200">
          {lostItems && lostItems.length > 0 ? (
            lostItems.map((item) => (
              <RowItem
                key={item.id}
                href={`/lost/${item.id}`}
                title={item.title}
                sublabel={`${CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS]} · Lost ${format(
                  new Date(item.date_lost),
                  "MMM d, yyyy"
                )}`}
                status={item.status}
              />
            ))
          ) : (
            <p className="px-5 py-6 text-sm text-slate-500">You haven&apos;t reported any lost items yet.</p>
          )}
        </div>
      </section>

      {/* ---------------- MY FOUND REPORTS ---------------- */}
      <section className="mt-10">
        <SectionHeader icon={PackageCheck} title="My found reports" actionHref="/report/found" actionLabel="Report found item" />
        <div className="card mt-3 divide-y divide-slate-200">
          {foundItems && foundItems.length > 0 ? (
            foundItems.map((item) => (
              <RowItem
                key={item.id}
                href={`/found/${item.id}`}
                title={item.title}
                sublabel={`${CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS]} · Found ${format(
                  new Date(item.date_found),
                  "MMM d, yyyy"
                )}`}
                status={item.status}
              />
            ))
          ) : (
            <p className="px-5 py-6 text-sm text-slate-500">You haven&apos;t reported any found items yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

/* ============================================================================
   Dashboard sub-components
   ============================================================================ */

const STAT_TONES = {
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-600",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-600",
  blue: "border-blue-200 bg-blue-50 text-blue-600",
} as const;

function StatTile({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  tone: keyof typeof STAT_TONES;
  label: string;
  value: number;
}) {
  return (
    <div className="card relative overflow-hidden p-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-12 h-28 w-28 rounded-full bg-blue-100/50 blur-2xl"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-600">{label}</p>
          <p className="mt-1.5 font-display text-3xl font-semibold tabular-nums text-navy-900">{value}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${STAT_TONES[tone]}`}>
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  actionHref,
  actionLabel,
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  title: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600">
          <Icon size={16} />
        </span>
        <h2 className="font-display text-lg font-semibold text-navy-900">{title}</h2>
      </div>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="btn-ghost !py-1.5 text-xs">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function RowItem({
  href,
  title,
  sublabel,
  status,
}: {
  href: string;
  title: string;
  sublabel: string;
  status: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-white/70"
    >
      <div>
        <p className="font-medium text-navy-900">{title}</p>
        <p className="text-xs text-slate-500">{sublabel}</p>
      </div>
      <StatusPill status={status} />
    </Link>
  );
}

const STATUS_TONES: Record<string, string> = {
  active: "border-blue-200 bg-blue-50 text-blue-700",
  recovered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  closed: "border-slate-200 bg-slate-100 text-slate-600",
};

function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONES[status] ?? "border-slate-200 bg-slate-100 text-slate-700";
  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs capitalize ${tone}`}>
      {status}
    </span>
  );
}


