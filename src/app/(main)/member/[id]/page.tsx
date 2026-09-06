import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { computeTrustSignals } from "@/lib/trust";
import { computeBadges, getBadgeStats } from "@/lib/badges";
import { BadgesCard } from "@/components/dashboard/badges-card";
import { getAvatarPublicUrl, getSignedImageUrls } from "@/lib/storage";
import { BlockUserButton } from "@/components/block-user-button";
import { UserReportButton } from "@/components/user-report-button";
import {
  VerifiedAccountBadge,
  TrustedMemberBadge,
  VerifiedSeal,
} from "@/components/ui/verification-badge";
import {
  ArrowLeft,
  CalendarDays,
  HeartHandshake,
  Lock,
  MapPin,
  PackageSearch,
} from "lucide-react";
import { MemberReports } from "@/components/member/member-reports";
import { CommunityMotif } from "@/components/ui/community-motif";

export const dynamic = "force-dynamic";

type ReportRow = {
  id: string;
  title: string;
  category: string | null;
  city: string | null;
  province: string | null;
  created_at: string | null;
  /** Lost items only — public reward offered. */
  reward_amount?: number | null;
  /** Lost items only — the date the item was lost. */
  date_occurred?: string | null;
};

async function reportList(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "lost_items" | "found_items",
  userId: string
): Promise<ReportRow[]> {
  const lostFields = table === "lost_items" ? "reward_amount, date_lost" : "date_found";
  const { data } = await supabase
    .from(table)
    .select(`id, title, category, city, province, created_at, ${lostFields}`)
    .eq("reporter_id", userId)
    .in("status", ["active", "matched"])
    .order("created_at", { ascending: false })
    .limit(20);
  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    category: (r.category ?? null) as string | null,
    city: (r.city ?? null) as string | null,
    province: (r.province ?? null) as string | null,
    created_at: (r.created_at ?? null) as string | null,
    reward_amount: table === "lost_items" ? ((r.reward_amount ?? null) as number | null) : undefined,
    date_occurred: table === "lost_items" ? ((r.date_lost ?? null) as string | null) : ((r.date_found ?? null) as string | null),
  }));
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

  // Resolve by member id (uuid) OR username — links in the app may use either.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const profileSelect = "id, username, first_name, last_name, avatar_url, bio, location, successful_returns, created_at";
  const { data: profile, error } = isUuid
    ? await supabase
        .from("profiles")
        .select(profileSelect)
        .or(`id.eq.${id},username.eq.${id.replace(/,/g, "")}`)
        .maybeSingle()
    : await supabase
        .from("profiles")
        .select(profileSelect)
        .eq("username", id)
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
      .join(" ") || "FindBack member";
  const initial = (profile.first_name?.[0] ?? "M").toUpperCase();
  const joined = profile.created_at
    ? format(new Date(profile.created_at), "MMMM yyyy")
    : null;

  // ── Report thumbnails — first photo per report (position 0) ──────────────
  // Same pattern as the saved page: pull position-0 rows from item_images and
  // resolve them via signed URLs. Only ever touches already-public photos.
  const reportIds = reports.map(({ row }) => row.id);
  let reportImage: Record<string, string> = {};
  if (reportIds.length > 0) {
    const lostReportIds = reports.filter((r) => r.kind === "lost").map((r) => r.row.id);
    const foundReportIds = reports.filter((r) => r.kind === "found").map((r) => r.row.id);
    const [lostImg, foundImg] = await Promise.all([
      lostReportIds.length
        ? supabase.from("item_images").select("lost_item_id, storage_path").in("lost_item_id", lostReportIds).eq("position", 0)
        : Promise.resolve({ data: null }),
      foundReportIds.length
        ? supabase.from("item_images").select("found_item_id, storage_path").in("found_item_id", foundReportIds).eq("position", 0)
        : Promise.resolve({ data: null }),
    ]);
    const lostPaths = (lostImg.data ?? []) as Array<{ lost_item_id: string; storage_path: string }>;
    const foundPaths = (foundImg.data ?? []) as Array<{ found_item_id: string; storage_path: string }>;
    const signedUrls = await getSignedImageUrls([
      ...lostPaths.map((p) => p.storage_path),
      ...foundPaths.map((p) => p.storage_path),
    ]);
    const map = new Map<string, string>();
    lostPaths.forEach((p, i) => { if (signedUrls[i]) map.set(p.lost_item_id, signedUrls[i]); });
    foundPaths.forEach((p, i) => { if (signedUrls[lostPaths.length + i]) map.set(p.found_item_id, signedUrls[lostPaths.length + i]); });
    reportImage = Object.fromEntries(map);
  }

  const lostCount = lost.length;
  const foundCount = found.length;
return (
    <div className="py-12 lg:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Back navigation */}
        <Link
          href="/discover"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-navy-900"
        >
          <ArrowLeft size={15} />
          Back to reports
        </Link>

        {/* ═════════ 1. COVER + IDENTITY HERO ═════════ */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-soft">
          {/* Cover banner */}
          <div className="relative h-32 overflow-hidden bg-gradient-to-br from-electric-600 via-electric-500 to-teal-400 sm:h-40">
            <CommunityMotif className="absolute -right-6 -top-8 h-48 w-80 opacity-20" aria-hidden />
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.3),transparent_55%)]"
            />
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent" />
          </div>

          {/* Identity row — avatar overlaps the cover */}
          <div className="px-5 pb-5 sm:px-8 sm:pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                {/* Avatar */}
                <div className="relative -mt-14 shrink-0 sm:-mt-16">
                  <div className="h-28 w-28 overflow-hidden rounded-2xl bg-gradient-to-br from-electric-500 to-electric-600 shadow-lg ring-4 ring-white sm:h-32 sm:w-32">
                    {profile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img loading="lazy"
                        src={getAvatarPublicUrl(profile.avatar_url)}
                        alt={`${fullName}'s avatar`}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display text-3xl font-bold text-white sm:text-4xl">
                        {initial}
                      </div>
                    )}
                  </div>
                  {trust.emailVerified && <VerifiedSeal size={28} />}
                </div>

                {/* Name + identity */}
                <div className="min-w-0 pb-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h1 className="truncate font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
                      {fullName}
                    </h1>
                    {trust.trustedMember && <TrustedMemberBadge />}
                    {trust.emailVerified && <VerifiedAccountBadge />}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {profile.username ? `@${profile.username}` : "FindBack member"}
                  </p>
                  {profile.location && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin size={12} className="text-slate-400" />
                      {profile.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 flex-wrap gap-2">
                {isOwn ? (
                  <Link href="/dashboard/profile" className="btn-secondary">
                    Edit profile
                  </Link>
                ) : (
                  <>
                    <BlockUserButton targetUserId={profile.id} />
                    <UserReportButton targetUserId={profile.id} />
                  </>
                )}
              </div>
            </div>

            {/* Bio — inline under the identity row */}
            {profile.bio && (
              <p className="mt-6 max-w-3xl text-sm leading-relaxed text-slate-700">
                {profile.bio}
              </p>
            )}

            {/* Stats strip — horizontal across all sizes */}
            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-slate-200/70 pt-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <HeartHandshake size={18} />
                </span>
                <div>
                  <p className="font-display text-lg font-bold text-navy-900">
                    {profile.successful_returns}
                  </p>
                  <p className="text-xs text-slate-500">items reunited</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ice-50 text-electric-600">
                  <CalendarDays size={18} />
                </span>
                <div>
                  <p className="font-display text-lg font-bold text-navy-900">{joined ?? "—"}</p>
                  <p className="text-xs text-slate-500">member since</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <PackageSearch size={18} />
                </span>
                <div>
                  <p className="font-display text-lg font-bold text-navy-900">{reports.length}</p>
                  <p className="text-xs text-slate-500">active reports</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════ 2. BODY — two-column layout ════════════ */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Left / main column — active reports */}
          <div className="min-w-0 lg:col-span-2">
            <MemberReports
              reports={reports}
              images={reportImage}
              isOwn={isOwn}
              memberName={profile.first_name || fullName}
            />
          </div>

          {/* Right rail — badges + privacy note */}
          <aside className="min-w-0 space-y-6">
            <section className="card p-6">
              <h2 className="font-display text-lg font-semibold tracking-tight text-navy-900">
                Badges
              </h2>
              <div className="mt-4">
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

            <div className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/60 p-4 text-xs leading-relaxed text-slate-600">
              <Lock size={15} className="mt-0.5 shrink-0 text-slate-400" />
              <p>
                Details here are limited to what&apos;s already public on FindBack PH — we never
                expose emails, phone numbers, or exact locations. To reach{" "}
                {profile.first_name || "this member"}, start a conversation through one of their
                reports.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
