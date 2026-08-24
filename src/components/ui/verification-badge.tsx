import { BadgeCheck, FileCheck2, HeartHandshake } from "lucide-react";

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
      className={`${base} border-violet-200 bg-violet-50 text-violet-700`}
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
