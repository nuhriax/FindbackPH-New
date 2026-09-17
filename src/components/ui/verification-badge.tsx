import { BadgeCheck, FileCheck2, HeartHandshake, Smartphone } from "lucide-react";

/**
 * Phase 7 trust badges — deliberately SUBTLE. Small inline pills meant to sit
 * next to a username or in a meta row, never big verification cards. Every
 * badge must be backed by real data (see src/lib/trust.ts); if the underlying
 * signal is absent, simply don't render the badge at all.
 */

const base =
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium leading-4 whitespace-nowrap";

export function VerifiedAccountBadge({ subtle = false }: { subtle?: boolean }) {
  return (
    <span
      title="This account confirmed its email address with Supabase Auth"
      className={`${base} border-emerald-200 bg-emerald-50 text-emerald-700`}
    >
      <BadgeCheck size={11} aria-hidden />
      {subtle ? "Verified" : "Verified account"}
    </span>
  );
}

/**
 * Blue verified seal (BadgeCheck) — an avatar overlay shown on profiles once
 * the member's email is verified. Sits on the avatar's bottom-right corner
 * like a social-platform verification seal.
 */
export function VerifiedSeal({
  className = "",
  size = 22,
  wrapperClassName = "",
}: {
  className?: string;
  size?: number;
  wrapperClassName?: string;
}) {
  return (
    <span
      title="Verified account"
      aria-label="Verified account"
      className={`absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-white shadow-sm ${wrapperClassName} ${className}`}
      style={wrapperClassName ? undefined : { width: size + 6, height: size + 6 }}
    >
      <BadgeCheck
        size={size}
        className="text-blue-500"
        strokeWidth={2.2}
        aria-hidden
      />
    </span>
  );
}

export function VerifiedReportBadge() {
  return (
    <span
      title="Posted by an email-verified member and includes photo evidence"
      className={`${base} border-blue-200 bg-blue-50 text-blue-700`}
    >
      <FileCheck2 size={11} aria-hidden />
      Verified report
    </span>
  );
}

export function TrustedMemberBadge() {
  return (
    <span
      title="Long-standing member with at least one successful return recorded on FindBack PH"
      className={`${base} border-navy-200 bg-navy-50 text-navy-700`}
    >
      <HeartHandshake size={11} aria-hidden />
      Trusted member
    </span>
  );
}

export function OwnershipVerifiedBadge() {
  return (
    <span
      title="The claimant answered the owner's private verification questions correctly"
      className={`${base} border-slate-200 bg-white text-slate-600`}
    >
      <BadgeCheck size={11} aria-hidden />
      Ownership verified
    </span>
  );
}

/**
 * Phase 8 — phone-verified pill. True SMS-OTP confirmation only
 * (auth.users.phone_confirmed_at); hidden entirely when absent.
 */
export function PhoneVerifiedBadge() {
  return (
    <span
      title="Confirmed their mobile number by SMS one-time code"
      className={`${base} border-teal-200 bg-teal-50 text-teal-700`}
    >
      <Smartphone size={11} aria-hidden />
      Phone verified
    </span>
  );
}

/**
 * Phase 8 — the strongest trust tier. Rendered ONLY when an admin approved
 * the member's government-ID review. Gold because it is earned, not claimed.
 */
export function IdVerifiedBadge({ seal = false }: { seal?: boolean }) {
  if (seal) {
    return (
      <span
        title="Government ID verified by the FindBack PH team"
        aria-label="ID verified"
        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sun-400 to-sun-600 text-white shadow-md ring-2 ring-white"
      >
        <BadgeCheck size={16} strokeWidth={2.4} aria-hidden />
      </span>
    );
  }
  return (
    <span
      title="Government ID verified by the FindBack PH team"
      className={`${base} border-sun-300 bg-sun-50 text-sun-700`}
    >
      <BadgeCheck size={11} aria-hidden />
      ID verified
    </span>
  );
}

/** Provider chip — shows HOW an account is backed (linked identity tier). */
export function ProviderBadge({ provider }: { provider: "google" | "facebook" }) {
  const meta =
    provider === "google"
      ? { label: "Google-linked", className: "border-slate-200 bg-white text-slate-600" }
      : { label: "Facebook-linked", className: "border-blue-200 bg-blue-50 text-blue-700" };
  return (
    <span
      title={`Signed up through ${provider === "google" ? "Google" : "Facebook"} — the account is backed by that provider identity`}
      className={`${base} ${meta.className}`}
    >
      {provider === "google" ? "G" : "f"}
      {meta.label}
    </span>
  );
}
