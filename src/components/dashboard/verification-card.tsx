"use client";

/**
 * Phase 8 — Verification Center (dashboard settings).
 *
 * One card shows all three trust tiers with honest state:
 *   1. Contact  — email confirmation (✓ when Supabase confirmed it).
 *   2. Phone    — SMS OTP via Supabase phone auth. If the phone provider
 *                 isn't enabled yet the error surfaces with a friendly note
 *                 instead of failing silently.
 *   3. ID       — voluntary government-ID upload into the PRIVATE bucket;
 *                 admin reviews, then the gold "ID verified" seal appears.
 */

import { useEffect, useState, useTransition } from "react";
import { BadgeCheck, CheckCircle2, FileUp, Info, Loader2, Send, Smartphone, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { submitIdVerificationAction, type ActionResult } from "@/lib/actions/verification";
import type { IdentityVerification } from "@/types/database";

const DOC_OPTIONS = [
  { value: "philsys", label: "PhilSys National ID" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "passport", label: "Passport" },
  { value: "umid", label: "UMID" },
  { value: "voters_id", label: "Voter's ID" },
] as const;

export function VerificationCard() {
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [idStatus, setIdStatus] = useState<"none" | "pending" | "approved" | "rejected">("none");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneMsg, setPhoneMsg] = useState<string | null>(null);
  const [phoneErr, setPhoneErr] = useState<string | null>(null);
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setEmailVerified(Boolean(user.email_confirmed_at ?? user.confirmed_at));
      setPhoneVerified(Boolean(user.phone_confirmed_at));
      const [{ data: row }, { data: lastReview }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id_verification_status")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("identity_verifications")
          .select("status, rejection_reason")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<IdentityVerification>(),
      ]);
      if (cancelled) return;
      setIdStatus(
        (row?.id_verification_status as typeof idStatus | undefined) ?? "none"
      );
      if (lastReview?.status === "rejected") {
        setRejectionReason(lastReview.rejection_reason ?? null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function toE164(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    return raw.trim().startsWith("+")
      ? `+${digits}`
      : `+63${digits.replace(/^0/, "")}`;
  }

  async function sendOtp() {
    setPhoneErr(null);
    setPhoneMsg(null);
    setPhoneBusy(true);
    try {
      const supabase = createClient();
      const e164 = toE164(phone);
      // Attach the phone to the SIGNED-IN account (updateUser), NOT the
      // sign-in OTP flow — signInWithOtp is for phones that already own an
      // account and fails with "Signups not allowed for otp" otherwise.
      const { error } = await supabase.auth.updateUser({ phone: e164 });
      if (error) {
        setPhoneErr(
          error.message.toLowerCase().includes("sms") ||
            error.message.toLowerCase().includes("provider") ||
            error.message.toLowerCase().includes("phone")
            ? "SMS sending isn't set up for the site yet — check back soon."
            : `Couldn't send the code: ${error.message}`
        );
      } else {
        setOtpSent(true);
        setPhoneMsg(`Code sent to ${e164}. Enter the 6 digits below.`);
      }
    } catch {
      setPhoneErr("Couldn't start phone verification. Please try again.");
    } finally {
      setPhoneBusy(false);
    }
  }

  async function verifyOtp() {
    setPhoneErr(null);
    setPhoneMsg(null);
    setPhoneBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        phone: toE164(phone),
        token: otp.replace(/\D/g, ""),
        type: "phone_change",
      });
      if (error) {
        setPhoneErr(`That code didn't work: ${error.message}`);
      } else {
        setPhoneVerified(true);
        setOtpSent(false);
        setPhoneMsg("Phone verified ✓");
      }
    } catch {
      setPhoneErr("Couldn't verify the code. Please try again.");
    } finally {
      setPhoneBusy(false);
    }
  }

  function handleIdSubmit(formData: FormData) {
    setSubmitErr(null);
    setSubmitMsg(null);
    startTransition(async () => {
      const result: ActionResult = await submitIdVerificationAction(formData);
      if (result?.error) {
        setSubmitErr(result.error);
      } else {
        setIdStatus("pending");
        setSubmitMsg("Submitted! We'll review your ID and update you here.");
      }
    });
  }

  const tierRow = (
    label: string,
    description: string,
    state: "verified" | "pending" | "none"
  ) => (
    <div className="flex items-start gap-2.5">
      {state === "verified" ? (
        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
      ) : state === "pending" ? (
        <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin text-slate-400" />
      ) : (
        <XCircle size={16} className="mt-0.5 shrink-0 text-slate-300" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-navy-900">{label}</p>
        <p className="text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );

  return (
    <section className="card p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sun-300 bg-sun-50 text-sun-600">
          <BadgeCheck size={18} />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold text-navy-900">
            Verification
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Build trust with the community. Verified members get priority in
            claim disputes.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {tierRow(
          "Email confirmed",
          "Your account's email address was confirmed at signup.",
          emailVerified ? "verified" : "none"
        )}
        {tierRow(
          "Phone verified",
          "Prove you're reachable with a one-time SMS code.",
          phoneVerified ? "verified" : "none"
        )}
        {tierRow(
          "Government ID verified",
          "Optional — upload an ID for manual review to earn the gold seal.",
          idStatus === "approved"
            ? "verified"
            : idStatus === "pending"
              ? "pending"
              : "none"
        )}
      </div>

      {/* Phone OTP — only shown while unverified */}
      {!phoneVerified && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
            <Smartphone size={13} />
            Verify your phone
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="09XX XXX XXXX"
              aria-label="Mobile number"
              className="input sm:flex-1"
            />
            <button
              type="button"
              onClick={sendOtp}
              disabled={phoneBusy || phone.replace(/\D/g, "").length < 10}
              className="btn-secondary shrink-0"
            >
              {phoneBusy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Send code
            </button>
          </div>
          {otpSent && (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit code"
                aria-label="One-time code"
                className="input sm:w-44"
              />
              <button
                type="button"
                onClick={verifyOtp}
                disabled={phoneBusy || otp.replace(/\D/g, "").length < 6}
                className="btn-primary shrink-0"
              >
                Verify
              </button>
            </div>
          )}
          {phoneMsg && (
            <p className="mt-2 text-xs font-medium text-emerald-700">{phoneMsg}</p>
          )}
          {phoneErr && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-600" role="alert">
              <Info size={13} className="mt-0.5 shrink-0" />
              {phoneErr}
            </p>
          )}
        </div>
      )}

      {/* Government ID — voluntary, private, manually reviewed */}
      {idStatus === "approved" ? (
        <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
          🏅 Your ID is verified — the gold seal shows on your profile.
        </p>
      ) : idStatus === "pending" ? (
        <p className="mt-5 rounded-xl border border-sun-200 bg-sun-50 p-3 text-sm text-sun-800">
          Your ID is being reviewed. We&apos;ll notify you here and by notification
          when it&apos;s done — usually within a few days.
        </p>
      ) : (
        <form action={handleIdSubmit} className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
            <FileUp size={13} />
            Get the gold ID verified seal
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="docType" className="label text-xs">ID type</label>
              <select id="docType" name="docType" required className="input">
                {DOC_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="document" className="label text-xs">ID photo (JPG/PNG/WebP, max 5&nbsp;MB)</label>
              <input
                id="document"
                name="document"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                className="input file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs"
              />
            </div>
          </div>
          <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-600">
            <input type="checkbox" name="consent" required className="mt-0.5" />
            <span>
              I consent to FindBack PH storing this image privately, in line with
              the Data Privacy Act, only for identity verification. I can delete
              it anytime in Settings → Delete account.
            </span>
          </label>
          {rejectionReason && idStatus === "rejected" && (
            <p className="mt-2 text-xs text-coral-700">
              Previous submission was declined: {rejectionReason}
            </p>
          )}
          {submitErr && <p className="field-error mt-2 text-xs" role="alert">{submitErr}</p>}
          {submitMsg && <p className="mt-2 text-xs font-medium text-emerald-700">{submitMsg}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary mt-3 !py-2 text-sm"
          >
            {isPending ? "Submitting…" : "Submit for review"}
          </button>
        </form>
      )}
    </section>
  );
}
