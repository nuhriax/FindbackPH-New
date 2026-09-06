import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BarChart3, PackageX, PackageCheck, HeartHandshake, TrendingUp, FlaskConical } from "lucide-react";
import { isAdminUser } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const authorized = await isAdminUser();
  if (!authorized) notFound();

  const supabase = await createClient();

  const [
    { count: totalLost },
    { count: totalFound },
    { count: recoveredCount },
    { count: activeLost },
    { count: activeFound },
    { count: totalUsers },
    { data: categoryData },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from("lost_items").select("*", { count: "exact", head: true }),
    supabase.from("found_items").select("*", { count: "exact", head: true }),
    supabase.from("lost_items").select("*", { count: "exact", head: true }).eq("status", "recovered"),
    supabase.from("lost_items").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("found_items").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("lost_items").select("category"),
    supabase.from("lost_items").select("created_at").order("created_at", { ascending: false }).limit(30),
  ]);

  // ── Product signals (last 30 days) — from product_events ─────────────────
  // Funnels built from first-party instrumentation (supabase/105-product-events.sql):
  // report wizard abandonment, filter usage, match usefulness, verification
  // comprehension, messaging volume, and mobile problem signals.
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  type ProductEvent = {
    event_name: string;
    props: Record<string, unknown> | null;
    created_at: string;
    path: string | null;
  };
  const { data: eventsData } = await supabase
    .from("product_events")
    .select("event_name, props, created_at, path")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);
  const events = (eventsData ?? []) as ProductEvent[];

  const countBy = (name: string) => (events ?? []).filter((e) => e.event_name === name).length;
  const reportStarted = countBy("report_started");
  const reportSubmitted = countBy("report_submitted");
  const reportAbandoned = countBy("report_abandoned");
  const searchCount = countBy("search_performed");
  const zeroResultSearches = (events ?? []).filter(
    (e) => e.event_name === "search_performed" && (e.props as Record<string, unknown> | null)?.result_count === 0
  ).length;
  const matchImpressions = countBy("match_impression");
  const matchClicks = countBy("match_clicked");
  const verifViewed = countBy("verification_viewed");
  const verifPassed = (events ?? []).filter(
    (e) => e.event_name === "verification_attempted" && (e.props as Record<string, unknown> | null)?.outcome === "passed"
  ).length;
  const verifAttempted = countBy("verification_attempted");
  const messagesSent = countBy("message_sent");
  const conversations = countBy("conversation_opened");
  const jsErrors = countBy("js_error");
  const rageClicks = countBy("rage_click");

  // Where in the wizard do people stop? group abandon events by last step.
  const abandonByStep: Record<string, number> = {};
  for (const e of events ?? []) {
    if (e.event_name !== "report_abandoned") continue;
    const step = String((e.props as Record<string, unknown> | null)?.last_step ?? "?");
    abandonByStep[step] = (abandonByStep[step] ?? 0) + 1;
  }

  // Which device class hits problems?
  const errorsMobile = (events ?? []).filter((e) => {
    if (e.event_name !== "js_error" && e.event_name !== "rage_click") return false;
    const p = e.props as Record<string, unknown> | null;
    return p?.device === "mobile" || p?.device === "tablet";
  }).length;
  const totalErrors = jsErrors + rageClicks;

  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
  const hasProductEvents = (events ?? []).length > 0;

  // Compute category distribution
  const categoryCounts: Record<string, number> = {};
  for (const item of categoryData ?? []) {
    const cat = item.category ?? "other";
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
  }
  const sortedCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const totalItems = (totalLost ?? 0) + (totalFound ?? 0);
  const recoveryRate = totalItems > 0 ? Math.round(((recoveredCount ?? 0) / totalItems) * 100) : 0;

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold tracking-tight text-navy-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of report activity and platform health.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center gap-2">
            <PackageX size={16} className="text-sunrise-600" />
            <p className="text-sm text-slate-600">Total Lost</p>
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-navy-900">{(totalLost ?? 0).toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2">
            <PackageCheck size={16} className="text-emerald-600" />
            <p className="text-sm text-slate-600">Total Found</p>
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-navy-900">{(totalFound ?? 0).toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2">
            <HeartHandshake size={16} className="text-leaf-600" />
            <p className="text-sm text-slate-600">Recovered</p>
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-navy-900">{(recoveredCount ?? 0).toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600" />
            <p className="text-sm text-slate-600">Recovery Rate</p>
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-navy-900">{recoveryRate}%</p>
        </div>
      </div>

      {/* ── Product Signals (last 30 days) ─────────────────────────────── */}
      <div className="mt-8 rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-soft backdrop-blur-md">
        <div className="flex items-center gap-2">
          <FlaskConical size={16} className="text-electric-600" />
          <h3 className="font-display text-sm font-semibold text-navy-900">
            Product Signals <span className="text-xs font-normal text-slate-400">· last 30 days</span>
          </h3>
        </div>

        {!hasProductEvents ? (
          <p className="mt-3 text-sm text-slate-500">
            No product events recorded yet. Run{" "}
            <code className="rounded bg-slate-100 px-1 text-xs">supabase/105-product-events.sql</code>{" "}
            in the SQL editor, then browse the site — funnels will appear here.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {/* Report funnel */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sunrise-600">Report funnel</p>
              <p className="mt-2 text-sm text-navy-900">
                {reportStarted} started · {reportSubmitted} submitted · <strong>{pct(reportSubmitted, reportStarted)}%</strong> completion
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {reportAbandoned} abandoned mid-wizard
                {Object.keys(abandonByStep).length > 0 &&
                  ` — by step: ${Object.entries(abandonByStep)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([step, n]) => `S${step}: ${n}`)
                    .join(", ")}`}
              </p>
            </div>

            {/* Search */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-electric-600">Search</p>
              <p className="mt-2 text-sm text-navy-900">
                {searchCount} searches · {zeroResultSearches} returned zero results ({pct(zeroResultSearches, searchCount)}%)
              </p>
              <p className="mt-1 text-xs text-slate-500">High zero-result rate means filters or listings need work.</p>
            </div>

            {/* Matching */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">Matching</p>
              <p className="mt-2 text-sm text-navy-900">
                {matchImpressions} impressions · {matchClicks} clicks · <strong>{pct(matchClicks, matchImpressions)}%</strong> click-through
              </p>
              <p className="mt-1 text-xs text-slate-500">Low CTR suggests matches aren&apos;t useful or visible enough.</p>
            </div>

            {/* Verification */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy-700">Ownership verification</p>
              <p className="mt-2 text-sm text-navy-900">
                {verifViewed} viewed · {verifAttempted} attempted · <strong>{pct(verifPassed, verifAttempted)}%</strong> passed
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Many views but few attempts = the form may confuse claimants.
              </p>
            </div>

            {/* Messaging */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-leaf-600">Messaging</p>
              <p className="mt-2 text-sm text-navy-900">
                {conversations} threads opened · {messagesSent} messages sent
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Threads opened but few messages sent = confusing composer or reply friction.
              </p>
            </div>

            {/* Mobile problems */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-red-500">Mobile friction</p>
              <p className="mt-2 text-sm text-navy-900">
                {jsErrors} JS errors · {rageClicks} rage clicks
                {totalErrors > 0 && ` · ${pct(errorsMobile, totalErrors)}% on mobile/tablet`}
              </p>
              <p className="mt-1 text-xs text-slate-500">Rage clicks = 3+ rapid taps in the same spot (frustration signal).</p>
            </div>
          </div>
        )}
      </div>

      {/* Category Distribution */}
      {sortedCategories.length > 0 && (
        <div className="mt-5 rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-soft backdrop-blur-md">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-electric-600" />
            <h3 className="font-display text-sm font-semibold text-navy-900">Top Categories</h3>
          </div>
          <div className="mt-4 space-y-3">
            {sortedCategories.map(([category, count]) => {
              const percentage = Math.round((count / (totalItems || 1)) * 100);
              return (
                <div key={category}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize text-navy-900">{category.replace(/_/g, " ")}</span>
                    <span className="text-slate-500">{count} ({percentage}%)</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-electric-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}