import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { ShieldCheck } from "lucide-react";
import { computeTrustSignals, isEmailVerified } from "@/lib/trust";
import { getBadgeStats, computeBadges } from "@/lib/badges";
import { BadgesCard } from "@/components/dashboard/badges-card";

export const metadata = {
  title: "Profile — FindBack PH",
  description: "Manage your public FindBack PH profile.",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/dashboard");

  // Badges are derived from existing public/report data — read-only, no DB changes.
  const stats = await getBadgeStats(supabase, user.id, {
    memberSince: profile.created_at,
    emailVerified: isEmailVerified(user),
  });
  stats.successfulReturns = profile.successful_returns ?? 0;
  const earnedBadges = computeBadges(stats);

  const name = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();

  // Trust signals for the profile hero (rendered inside the client form).
  const trust = computeTrustSignals({
    emailVerified: isEmailVerified(user),
    profileCreatedAt: profile.created_at,
    successfulReturns: profile.successful_returns,
  });
  const joinedLabel = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  // Masked account email shown on the verification banner / account context.
  const email = user.email ?? "";
  const [emailUser, emailDomain] = email.split("@");
  const maskedEmail = emailUser
    ? `${emailUser.slice(0, 1)}${"*".repeat(Math.min(4, Math.max(2, emailUser.length - 1)))}@${emailDomain}`
    : "your email";

  // Public profile link — username when set, else the member id (both resolve).
  const memberHref = `/member/${profile.username || user.id}`;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-3xl">
        Profile
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
        Update the details others see when you report or respond on FindBack PH.
      </p>

      <div className="mt-8">
        <ProfileForm
          profile={profile}
          trust={{ emailVerified: trust.emailVerified, trustedMember: trust.trustedMember }}
          successfulReturns={profile.successful_returns ?? 0}
          joinedLabel={joinedLabel}
          emailVerified={trust.emailVerified}
          memberHref={memberHref}
          maskedEmail={maskedEmail}
        />
      </div>

      {/* Badges — derived from existing public data; purely presentational */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
          Badges
        </h2>
        <div className="mt-4">
          <BadgesCard
            successfulReturns={profile.successful_returns}
            badges={earnedBadges.map(({ id, emoji, name, description, earned }) => ({
              id,
              emoji,
              name,
              description,
              earned,
            }))}
          />
        </div>
      </section>

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/60 p-4 text-sm text-slate-600">
        <ShieldCheck size={17} className="mt-0.5 shrink-0 text-emerald-600" />
        <p>
          Your private details are never shown publicly. Profile photo, name, and username are
          visible only to others when relevant to a report or conversation.
        </p>
      </div>
    </div>
  );
}