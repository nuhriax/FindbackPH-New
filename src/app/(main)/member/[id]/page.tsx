import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { computeTrustSignals } from "@/lib/trust";
import { computeBadges, getBadgeStats } from "@/lib/badges";
import { BadgesCard } from "@/components/dashboard/badges-card";
import { getAvatarPublicUrl } from "@/lib/storage";
import { CATEGORY_LABELS } from "@/lib/validation";
import { BlockUserButton } from "@/components/block-user-button";
import { UserReportButton } from "@/components/user-report-button";
import {
  VerifiedAccountBadge,
  TrustedMemberBadge,
} from "@/components/ui/verification-badge";
import { HeartHandshake, MapPin, PackageSearch, PackageCheck } from "lucide-react";

export const dynamic = "force-dynamic";

type ReportRow = {
  id: string;
  title: string;
  category: string | null;
  city: string | null;
  province: string | null;
  created_at: string | null;
};

async function reportList(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "lost_items" | "found_items",
  userId: string
): Promise<ReportRow[]> {
  const { data } = await supabase
    .from(table)
    .select("id, title, category, city, province, created_at")
    .eq("reporter_id", userId)
    .in("status", ["active", "matched"])
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []) as ReportRow[];
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function MemberProfilePage({ params }: Props) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, username, first_name, last_name, avatar_url, bio, successful_returns, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !profile) notFound();

  const isOwn = profile.id === user.id;

  // Real "verified account" signal for THIS member (their email confirmed).
  const { data: emailVerifiedRow } = await supabase.rpc("is_email_verified", {
    p_uid: profile.id,
  });
  const emailVerified = Boolean(emailVerifiedRow);

  const trust = computeTrustSignals({
    emailVerified,
    profileCreatedAt: profile.created_at ?? null,
    successfulReturns: profile.successful_returns,
  });

  const [lost, found] = await Promise.all([
    reportList(supabase, "lost_items", profile.id),
    reportList(supabase, "found_items", profile.id),
  ]);

  // Badge computation — derived from already-public data, respects RLS.
  const badgeStats = await getBadgeStats(supabase, profile.id, {
    memberSince: profile.created_at ?? null,
    emailVerified,
  });
  badgeStats.successfulReturns = profile.successful_returns;
  const earnedBadges = computeBadges(badgeStats);

  const reports = [
    ...lost.map((r) => ({ row: r, kind: "lost" as const })),
    ...found.map((r) => ({ row: r, kind: "found" as const })),
  ].sort((a, b) =>
    (b.row.created_at ?? "").localeCompare(a.row.created_at ?? "")
  );

  const fullName =
    [profile.first_name ?? "", profile.last_name ?? ""]
      .filter(Boolean)
      .join(" ") || profile.username || "FindBack member";
  const initial = (profile.first_name?.[0] ?? profile.username?.[0] ?? "M").toUpperCase();
  const joined = profile.created_at
    ? format(new Date(profile.created_at), "MMMM yyyy")
    : null;
return (
    <div className="py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Profile card — identity + facts in one */}
        <section className="card overflow-hidden">
          <div className="h-28 bg-gradient-to-br from-electric-500/15 via-ice-50 to-emerald-50/60" />
          <div className="flex flex-col gap-4 px-6 sm:flex-row sm:items-end sm:px-8">
            <div className="-mt-10">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getAvatarPublicUrl(profile.avatar_url)}
                  alt={`${fullName}'s avatar`}
                  referrerPolicy="no-referrer"
                  className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-soft"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-electric-500 to-electric-600 font-display text-3xl font-bold text-white shadow-soft">
                  {initial}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 sm:pb-1">
              <h1 className="font-display text-2xl font-bold tracking-tight text-navy-900">
                {fullName}
              </h1>
              <p className="text-sm text-slate-500">@{profile.username}</p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {trust.emailVerified && <VerifiedAccountBadge />}
                {trust.trustedMember && <TrustedMemberBadge />}
                {!isOwn && (
                  <>
                    <BlockUserButton targetUserId={profile.id} />
                    <UserReportButton targetUserId={profile.id} />
                  </>
                )}
              </div>
            </div>

            {isOwn && (
              <Link href="/dashboard/profile" className="btn-secondary sm:pb-1">
                Edit profile
              </Link>
            )}
          </div>

          {/* Facts strip — same card, divided from the identity block */}
          <div className="mt-5 grid grid-cols-2 divide-x divide-slate-200/70 border-t border-slate-200/70 bg-ice-50/40">
            <div className="flex items-center gap-3 px-6 py-4 sm:px-8">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <HeartHandshake size={18} />
              </span>
              <div>
                <p className="font-display text-xl font-bold text-navy-900">
                  {profile.successful_returns}
                </p>
                <p className="text-xs text-slate-500">items reunited</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 sm:px-8">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ice-50 text-electric-600">
                <MapPin size={18} />
              </span>
              <div>
                <p className="font-display text-xl font-bold text-navy-900">
                  {joined ?? "—"}
                </p>
                <p className="text-xs text-slate-500">member since</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bio */}
        {profile.bio && (
          <section className="mt-5 card p-6">
            <p className="text-sm leading-relaxed text-slate-700">{profile.bio}</p>
          </section>
        )}

        {/* Badges */}
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
            Badges
          </h2>
          <div className="mt-4 card p-6">
            <BadgesCard
              successfulReturns={profile.successful_returns}
              badges={earnedBadges.map(
                ({ id, emoji, name, description, earned }) => ({
                  id,
                  emoji,
                  name,
                  description,
                  earned,
                })
              )}
            />
          </div>
        </section>

        {/* Reports — safe, already-public listings only */}
        <section className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
              Active reports
            </h2>
            <span className="text-xs text-slate-500">{reports.length} shown</span>
          </div>

          {reports.length === 0 ? (
            <div className="mt-4 card p-8 text-center text-sm text-slate-600">
              No active reports right now.
            </div>
          ) : (
            <div className="mt-4 space-y-2.5">
              {reports.map(({ row, kind }) => (
                <Link
                  key={`${kind}-${row.id}`}
                  href={kind === "lost" ? `/lost/${row.id}` : `/found/${row.id}`}
                  className="card flex items-center gap-4 p-4 transition-colors hover:border-electric-400/40 hover:shadow-card-hover"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      kind === "lost"
                        ? "bg-sunrise-50 text-sunrise-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {kind === "lost" ? <PackageSearch size={18} /> : <PackageCheck size={18} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy-900">{row.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {kind === "lost" ? "Lost" : "Found"}
                      {row.category ? ` · ${CATEGORY_LABELS[row.category as keyof typeof CATEGORY_LABELS] ?? row.category}` : ""}
                      {[row.city, row.province].filter(Boolean).length
                        ? ` · ${[row.city, row.province].filter(Boolean).join(", ")}`
                        : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-xs leading-relaxed text-slate-400">
          Details shown here are limited to what&apos;s already public on FindBack PH — we
          never expose emails, phone numbers, or exact locations. Message someone through
          one of their reports above.
        </p>
      </div>
    </div>
  );
}
