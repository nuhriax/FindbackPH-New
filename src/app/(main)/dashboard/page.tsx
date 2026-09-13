import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Bookmark,
  ChevronRight,
  HeartHandshake,
  PackageCheck,
  PackageSearch,
  PackageX,
  Sparkles,
} from "lucide-react";
import { ReuniteFeedback, type ReuniteItem } from "@/components/dashboard/reunite-feedback";
import { DashboardMatches } from "@/components/dashboard/dashboard-matches";
import { DashboardMyReports } from "@/components/dashboard/dashboard-my-reports";
import { DashboardActivity } from "@/components/dashboard/dashboard-activity";
import { NeedsAttention } from "@/components/dashboard/needs-attention";

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
    { data: notifications = [] },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("lost_items")
      .select("id, title, category, status, date_lost, city, province, created_at")
      .eq("reporter_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("found_items")
      .select("id, title, category, status, date_found, city, province, created_at")
      .eq("reporter_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("saved_items")
      .select("id, lost_item_id, found_item_id, lost_items(title, status, category), found_items(title, status, category)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("notifications")
      .select("id, type, title, message, link, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
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

  const unreadNotifications = (notifications ?? []).filter((n: any) => !n.read);

  const firstName = profile?.first_name?.trim() || "";
  const lastName = profile?.last_name?.trim() || "";
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    "Member";

  const hasContent =
    (lostItems?.length ?? 0) > 0 ||
    (foundItems?.length ?? 0) > 0 ||
    (savedItems?.length ?? 0) > 0 ||
    undismissedMatches.length > 0;

  const stats = [
    { label: "Active lost", value: activeLost, icon: PackageX, tone: "sunrise" as const, href: "/dashboard/reports?kind=lost&status=active" },
    { label: "Active found", value: activeFound, icon: PackageCheck, tone: "emerald" as const, href: "/dashboard/reports?kind=found&status=active" },
    { label: "Possible matches", value: undismissedMatches.length, icon: Sparkles, tone: "blue" as const, href: "/dashboard" },
    { label: "Recovered", value: recovered, icon: HeartHandshake, tone: "leaf" as const, href: "/dashboard/reports?status=recovered" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* ── Page header — lean app bar: identity + context left, actions right ── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-electric-50 to-electric-50 text-lg font-bold text-electric-700">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img loading="lazy" src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              (firstName || displayName).charAt(0).toUpperCase()
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-electric-600">
              Dashboard
            </p>
            <h1 className="truncate font-display text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">
              Welcome back, {firstName || displayName}
            </h1>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {activeLost + activeFound > 0
                ? `${activeLost + activeFound} active report${activeLost + activeFound === 1 ? "" : "s"} · ${unreadNotifications.length} unread update${unreadNotifications.length === 1 ? "" : "s"}`
                : "Let's help your lost item find its way home."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/report/lost" className="btn-primary">
            <PackageSearch size={16} />
            Report lost
          </Link>
          <Link href="/report/found" className="btn-secondary">
            <HeartHandshake size={16} />
            Report found
          </Link>
        </div>
      </header>

      {/* ── KPI strip ── */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            aria-label={`${s.label}: ${s.value}`}
            className="card group relative block overflow-hidden p-4 transition hover:-translate-y-0.5 hover:border-electric-200 hover:shadow-lg"
          >
            <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${STAT_ACCENT[s.tone]}`} />
            <div className="relative flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-600">{s.label}</p>
                <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-navy-900">{s.value}</p>
              </div>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${STAT_TONES[s.tone]} group-hover:scale-105`}>
                <s.icon size={18} />
              </span>
            </div>
            <ChevronRight
              size={14}
              aria-hidden
              className="absolute bottom-3 right-3 text-slate-300 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
            />
          </Link>
        ))}
      </div>

      {/* ── First-run onboarding — only for brand-new accounts ── */}
      {!hasContent && (
        <div className="onboarding-panel mt-6 rounded-2xl border border-electric-200/70 bg-gradient-to-br from-electric-50/60 to-white/70 p-5 shadow-soft backdrop-blur-md sm:p-6">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-electric-600" />
            <h2 className="font-display text-sm font-semibold text-navy-900">Get started on FindBack PH</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Report a lost item",
                text: "Add photos, a location, and details — takes about 2 minutes.",
                href: "/report/lost",
              },
              {
                step: "2",
                title: "Found something?",
                text: "Post it so the owner can reach you safely through messages.",
                href: "/report/found",
              },
              {
                step: "3",
                title: "Browse nearby reports",
                text: "Search by item, category, and city to find your match.",
                href: "/discover",
              },
            ].map((s) => (
              <Link
                key={s.step}
                href={s.href}
                className="group rounded-xl border border-slate-200/70 bg-white/80 p-4 transition hover:-translate-y-0.5 hover:border-electric-200 hover:shadow-md"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-electric-600 text-xs font-bold text-white">
                  {s.step}
                </span>
                <p className="mt-2.5 text-sm font-semibold text-navy-900 group-hover:text-electric-700">{s.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{s.text}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Reunite prompt — full-width moment of celebration ── */}
      {recoveredItems.length > 0 && (
        <div className="mt-6">
          <ReuniteFeedback items={recoveredItems} />
        </div>
      )}

      {/* ── Main grid: priority content left, monitoring rail right ── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main column — matches are why people come back, so they lead */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <DashboardMatches matches={undismissedMatches} />
          <DashboardMyReports lostItems={lostItems} foundItems={foundItems} />
        </div>

        {/* Right rail — action items and recent happenings */}
        <aside className="min-w-0 space-y-6">
          <NeedsAttention
            unreadNotifications={unreadNotifications}
            undismissedMatches={undismissedMatches}
            hasContent={hasContent}
          />
          <DashboardActivity notifications={notifications ?? []} />

                <Link
                  href="/dashboard/saved"
                  className="card group flex items-center justify-between gap-3 p-4 transition hover:-translate-y-0.5 hover:border-electric-200 hover:shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-electric-200 bg-electric-50 text-electric-600">
                      <Bookmark size={16} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-navy-900 group-hover:text-electric-700">Saved reports</p>
                      <p className="text-xs text-slate-500">{savedItems?.length ?? 0} bookmarked</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-electric-500" />
                </Link>
        </aside>
      </div>
    </div>
  );
}

const STAT_TONES: Record<string, string> = {
  sunrise: "border-sunrise-200 bg-sunrise-50 text-sunrise-600",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-600",
  blue: "border-electric-200 bg-electric-50 text-electric-600",
  leaf: "border-leaf-200 bg-leaf-50 text-leaf-600",
};

const STAT_ACCENT: Record<string, string> = {
  sunrise: "bg-sunrise-200",
  emerald: "bg-emerald-200",
  blue: "bg-electric-200",
  leaf: "bg-leaf-200",
};