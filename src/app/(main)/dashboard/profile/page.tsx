import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { CalendarDays, HeartHandshake, ShieldCheck, UserRound } from "lucide-react";
import { VerifiedAccountBadge, TrustedMemberBadge } from "@/components/ui/verification-badge";
import { computeTrustSignals, isEmailVerified } from "@/lib/trust";

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

  const name = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
  const initial = (name || profile.username || "U").charAt(0).toUpperCase();

  return (
    <div>
      <span className="section-eyebrow">Your account</span>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-navy-900">
        Profile
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
        Update the details others see when you report or respond on FindBack PH.
      </p>

      <div className="mt-8 flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-xl font-semibold text-blue-700">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="h-full w-full rounded-2xl object-cover" />
          ) : (
            <UserRound size={24} />
          )}
        </span>
        <div>
          <p className="font-display text-lg font-semibold text-navy-900">{name || "FindBack member"}</p>
          <p className="text-sm text-slate-500">@{profile.username}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {(() => {
              const trust = computeTrustSignals({
                emailVerified: isEmailVerified(user),
                profileCreatedAt: profile.created_at,
                successfulReturns: profile.successful_returns,
              });
              return (
                <>
                  {trust.emailVerified && <VerifiedAccountBadge />}
                  {trust.trustedMember && <TrustedMemberBadge />}
                </>
              );
            })()}
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              <HeartHandshake size={13} />
              {profile.successful_returns ?? 0} returns
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">
              <CalendarDays size={13} />
              Joined {profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ProfileForm profile={profile} />
      </div>

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