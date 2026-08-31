import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BellRing,
  Bookmark,
  HeartHandshake,
  PackageCheck,
  PackageSearch,
  PackageX,
} from "lucide-react";
import { CommunityMotif } from "@/components/ui/community-motif";
import { OverviewTabs } from "@/components/dashboard/overview-tabs";
import { ReuniteFeedback, type ReuniteItem } from "@/components/dashboard/reunite-feedback";

type DashboardMatch = {
  id: string;
  score: number | null;
  dismissed: boolean;
  lost_item_id: string;
  found_item_id: string;
  found_items:
    | { id: string; title: string; city: string; province: string; category: string }
    | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { data: lostItems = [] },
    { data: foundItems = [] },
    { data: savedItems = [] },
    { data: profile },
  ] = await Promise.all([
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
      .select("id, lost_item_id, found_item_id, lost_items(title, status, category), found_items(title, status, category)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("profiles").select("first_name, last_name, username, avatar_url").eq("id", user.id).maybeSingle(),
  ]);

  let matches: DashboardMatch[] = [];
  const lostItemIds = (lostItems ?? []).map((i) => i.id);

  if (lostItemIds.length > 0) {
    const { data } = await supabase
      .from("matches")
      .select("id, score, dismissed, lost_item_id, found_item_id, found_items(id, title, city, province, category)")
      .in("lost_item_id", lostItemIds);
    matches = data ?? [];
  }

  const activeLost = (lostItems ?? []).filter((i) => i.status === "active").length;
  const activeFound = (foundItems ?? []).filter((i) => i.status === "active").length;
  const recovered =
    (lostItems ?? []).filter((i) => i.status === "recovered").length +
    (foundItems ?? []).filter((i) => i.status === "recovered").length;
  const savedCount = (savedItems ?? []).length;

  const recoveredItems: ReuniteItem[] = [
    ...(lostItems ?? [])
      .filter((i) => i.status === "recovered")
      .map((i) => ({ id: i.id, title: i.title, kind: "lost" as const })),
    ...(foundItems ?? [])
      .filter((i) => i.status === "recovered")
      .map((i) => ({ id: i.id, title: i.title, kind: "found" as const })),
  ];

  const undismissedMatches = (matches ?? []).filter(
    (m: any) => !m.dismissed && m.found_items
  );

  const firstName = profile?.first_name?.trim() || "";
  const lastName = profile?.last_name?.trim() || "";
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    profile?.username?.trim() ||
    "Member";
  const displayInitial = (profile?.first_name || profile?.username || "M").charAt(0).toUpperCase();
  const greeting = `Welcome back, ${displayName}`;
  const hasContent =
    (lostItems ?? []).length > 0 || (foundItems ?? []).length > 0 || (savedItems ?? []).length > 0 || undismissedMatches.length > 0;

  const stats = [
    { label: "Active lost", value: activeLost, icon: PackageX, tone: "sunrise" },
    { label: "Active found", value: activeFound, icon: PackageCheck, tone: "emerald" },
    { label: "Recovered", value: recovered, icon: HeartHandshake, tone: "leaf" },
    { label: "Saved", value: savedCount, icon: Bookmark, tone: "violet" },
  ] as const;

  return (
    <div>
      {/* Header — professional welcome card */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-blue-200 bg-blue-50 text-xl font-semibold text-blue-700">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                displayInitial
              )}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <CommunityMotif className="h-5 w-16" />
                <span className="section-eyebrow">Your FindBack workspace</span>
              </div>
              <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-[-0.02em] text-navy-900">
                {greeting}
              </h1>
              {profile?.username && (
                <p className="mt-0.5 text-sm text-slate-500">
                  @{profile.username} · Here&apos;s what&apos;s happening with your reports.
                </p>
              )}
            </div>
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
      </div>

      {/* Match candidates — the retention loop: surface waiting matches
          prominently instead of hiding them behind notifications. */}
      {undismissedMatches.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-electric-50/50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100 text-emerald-600">
                <BellRing size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                  Waiting for you
                </p>
                <h2 className="mt-0.5 font-display text-base font-bold text-navy-900 sm:text-lg">
                  {undismissedMatches.length} possible match
                  {undismissedMatches.length > 1 ? "es" : ""} on your report
                  {undismissedMatches.length > 1 ? "s" : ""}
                </h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Our engine found {undismissedMatches.length > 1 ? "reports" : "a report"} that look
                  {undismissedMatches.length > 1 ? "" : "s"} like your item. Take a look — one might be it.
                </p>
              </div>
            </div>
            <Link href="/dashboard" className="btn-primary shrink-0" aria-label="Review possible matches">
              <HeartHandshake size={16} />
              Review matches
            </Link>
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {undismissedMatches.slice(0, 4).map((m: DashboardMatch) => (
              <li key={m.id}>
                <Link
                  href={`/found/${m.found_item_id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white bg-white/80 px-3.5 py-2.5 text-sm shadow-sm transition hover:border-emerald-200 hover:bg-white"
                >
                  <span className="min-w-0 truncate font-medium text-navy-900">
                    {m.found_items?.title ?? "Found item"}
                  </span>
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-emerald-700">
                    {m.score != null ? `${Math.round(m.score)}% match` : "match"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stat tiles */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <StatTile key={s.label} icon={s.icon} tone={s.tone} label={s.label} value={s.value} />
        ))}
      </div>

      {/* Getting started banner */}
      {!hasContent && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-electric-100 bg-gradient-to-br from-electric-50/80 via-white to-emerald-50/40 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-electric-600">Getting started</p>
              <h2 className="mt-1 font-display text-lg font-bold text-navy-900 sm:text-xl">Let&apos;s bring one thing home today</h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">Post your first report to start matching with the community.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href="/report/lost" className="btn-secondary">
                <PackageSearch size={16} /> I lost something
              </Link>
              <Link href="/report/found" className="btn-primary">
                <HeartHandshake size={16} /> I found something
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* "Did it reunite?" user signal */}
      {recoveredItems.length > 0 && (
        <div className="mt-5">
          <ReuniteFeedback items={recoveredItems} />
        </div>
      )}

      {/* Tabbed activity panel */}
      <div className="mt-5">
        <OverviewTabs
          matches={undismissedMatches}
          savedItems={savedItems ?? []}
          lostItems={lostItems ?? []}
          foundItems={foundItems ?? []}
        />
      </div>
    </div>
  );
}

const STAT_TONES: Record<string, string> = {
  sunrise: "border-sunrise-200 bg-sunrise-50 text-sunrise-600",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-600",
  blue: "border-blue-200 bg-blue-50 text-blue-600",
  violet: "border-violet-200 bg-violet-50 text-violet-600",
  leaf: "border-leaf-200 bg-leaf-50 text-leaf-600",
};

const STAT_ACCENT: Record<string, string> = {
  sunrise: "bg-sunrise-200",
  emerald: "bg-emerald-200",
  blue: "bg-blue-200",
  violet: "bg-violet-200",
};

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
    <div className="card group relative overflow-hidden p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
      <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${STAT_ACCENT[tone]}`} />
      <div className="relative flex items-center justify-between gap-2">
        <div>
          <p className="text-sm text-slate-600">{label}</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-navy-900">{value}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${STAT_TONES[tone]} group-hover:scale-105`}>
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}
