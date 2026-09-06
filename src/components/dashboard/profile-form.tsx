"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CalendarDays, Camera, CheckCircle2, Copy, ExternalLink, HeartHandshake, Loader2, MailCheck, Save, ShieldAlert, Trash2 } from "lucide-react";
import { updateProfileAction, removeAvatarAction, resendVerificationAction } from "@/lib/actions/profile";
import { uploadAvatarClient } from "@/lib/file-upload-client";
import { VerifiedAccountBadge, TrustedMemberBadge } from "@/components/ui/verification-badge";
import type { Profile } from "@/types/database";

export function ProfileForm({
  profile,
  trust,
  successfulReturns,
  joinedLabel,
  emailVerified,
  memberHref,
  maskedEmail,
}: {
  profile: Profile;
  /** Trust chips (computed server-side, passed as plain booleans). */
  trust: { emailVerified: boolean; trustedMember: boolean };
  successfulReturns: number;
  joinedLabel: string;
  /** Whether the auth email is confirmed — gates the Verified badge. */
  emailVerified: boolean;
  /** Link to this member's public profile page. */
  memberHref: string;
  /** Masked account email, e.g. "j***@gmail.com". */
  maskedEmail: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSaved, setAvatarSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [firstName, setFirstName] = useState(profile.first_name ?? "");
  const [lastName, setLastName] = useState(profile.last_name ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");

  const filled = [firstName.trim(), lastName.trim(), location.trim(), bio.trim()].filter(Boolean).length;
  const completion = Math.round((filled / 4) * 100);
  const initial = (firstName || "U").charAt(0).toUpperCase();

  // ── Dirty state — warn before losing unsaved edits ────────────────────────
  const initialSnapshot = useMemo(
    () =>
      JSON.stringify({
        firstName: profile.first_name ?? "",
        lastName: profile.last_name ?? "",
        location: profile.location ?? "",
        bio: profile.bio ?? "",
      }),
    [profile]
  );
  const isDirty =
    JSON.stringify({ firstName, lastName, location, bio }) !== initialSnapshot;

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  // ── Copy public profile link ──────────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  function copyProfileLink() {
    void navigator.clipboard
      .writeText(`${window.location.origin}${memberHref}`)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  // ── Resend verification email ─────────────────────────────────────────────
  const [resendPending, startResend] = useTransition();
  const [resendSent, setResendSent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  function handleResend() {
    setResendError(null);
    startResend(async () => {
      const result = await resendVerificationAction();
      if ("error" in result && result.error) {
        setResendError(result.error);
      } else {
        setResendSent(true);
      }
    });
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    // The avatar is uploaded separately through the route handler
    // (uploadAvatarClient) — the raw File must NOT be serialized into this
    // server action body or large photos blow past Next.js's action size cap.
    formData.delete("avatarFile");
    startTransition(async () => {
      const result = await updateProfileAction(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  async function handleFileChange(file: File | undefined) {
    if (!file) return;
    setAvatarError(null);
    setUploading(true);

    // Instant local preview — show the chosen photo immediately via an object
    // URL while the real upload runs, so the user sees the change right away.
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setAvatarUrl(previewUrl);

    // Upload through the route handler — Server Actions can't accept File args.
    const result = await uploadAvatarClient(file);
    setUploading(false);
    if (result?.error) {
      // Upload failed — fall back to the previously saved photo.
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setAvatarUrl(profile.avatar_url ?? "");
      setAvatarError(result.error);
      return;
    }
    if (result.avatarUrl) {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setAvatarUrl(result.avatarUrl);
      setAvatarSaved(true);
      window.setTimeout(() => setAvatarSaved(false), 2500);
    }
  }

  function handleRemovePhoto() {
    setAvatarError(null);
    setUploading(true);
    startTransition(async () => {
      const result = await removeAvatarAction();
      setUploading(false);
      if (result?.error) {
        setAvatarError(result.error);
      } else {
        setAvatarUrl("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  }

    return (
    <form action={handleSubmit}>
      {/* ── Verify email banner — trust gate for the Verified badge ── */}
      {!emailVerified && (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy-900">Verify your email address</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-600">
                Confirm {maskedEmail} to earn the <strong>Verified account</strong> badge others
                see on your reports — it makes people far more comfortable replying to you.
              </p>
              {resendError && <p className="mt-1 text-xs font-medium text-red-600">{resendError}</p>}
            </div>
          </div>
          {resendSent ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-700">
              <MailCheck size={15} />
              Email sent — check your inbox
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendPending}
              className="btn-primary shrink-0 !py-2.5 text-sm disabled:opacity-60"
            >
              {resendPending ? <Loader2 size={15} className="animate-spin" /> : <MailCheck size={15} />}
              {resendPending ? "Sending…" : "Resend verification link"}
            </button>
          )}
        </div>
      )}

      {/* ── Profile hero — avatar with camera badge, identity, completion ── */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {/* Avatar + camera badge overlay */}
          <div className="flex flex-col items-center gap-1.5 sm:items-start">
            <div className="relative">
              <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-50 to-electric-50 text-3xl font-semibold text-blue-700 ring-4 ring-white">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img loading="lazy" src={avatarUrl} alt="Profile preview" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </span>

              {/* Camera badge — tap to change photo */}
              <button
                type="button"
                aria-label="Change profile photo"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-0.5 -right-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-md ring-2 ring-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
              </button>

              {/* Saved confirmation pop */}
              {avatarSaved && (
                <span className="absolute -top-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow ring-2 ring-white">
                  <CheckCircle2 size={14} />
                </span>
              )}

              <input
                ref={fileInputRef}
                id="avatarFile"
                name="avatarFile"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />
            </div>

            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={uploading}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 transition-colors hover:text-red-500 disabled:opacity-50"
              >
                <Trash2 size={11} />
                Remove photo
              </button>
            )}
            {avatarError && (
              <p className="max-w-[10rem] text-center text-[11px] font-medium text-red-600 sm:text-left">{avatarError}</p>
            )}
          </div>

          {/* Identity + meta */}
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-semibold text-navy-900">
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : "Your full name"}
            </p>
            <p className="text-sm text-slate-500">FindBack member</p>
            {bio && <p className="mt-1 line-clamp-1 text-xs text-slate-400">{bio}</p>}
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {trust.emailVerified && <VerifiedAccountBadge />}
              {trust.trustedMember && <TrustedMemberBadge />}
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                <HeartHandshake size={13} />
                {successfulReturns} returns
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">
                <CalendarDays size={13} />
                Joined {joinedLabel}
              </span>
            </div>

            {/* Public profile — see & share what others see */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <a
                href={memberHref}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/70 px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
              >
                <ExternalLink size={12} />
                View public profile
              </a>
              <button
                type="button"
                onClick={copyProfileLink}
                aria-label="Copy public profile link"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-700"
              >
                {copied ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
                {copied ? "Link copied" : "Copy link"}
              </button>
            </div>
          </div>

          {/* Completion meter */}
          <div className="sm:w-52">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-500">Profile completion</span>
              <span className="text-navy-900">{completion}%</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] leading-4 text-slate-500">
              {completion === 100
                ? "Looks great — your profile is complete."
                : "Add a location & bio to help others trust your reports."}
            </p>
          </div>
        </div>
      </div>

      {/* ── Details form ── */}
      <div className="card mt-5 p-6 sm:p-8">
        <h2 className="font-display text-sm font-semibold text-navy-900">Personal details</h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="label">First name</label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            maxLength={60}
            className="input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="lastName" className="label">Last name</label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            maxLength={60}
            className="input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="location" className="label">Location</label>
        <input
          id="location"
          name="location"
          type="text"
          maxLength={120}
          className="input"
          placeholder="e.g. Quezon City, Metro Manila"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <p className="mt-1.5 text-xs text-slate-400">
          Shown publicly only as &ldquo;City, Province&rdquo; on your reports — never your exact address.
        </p>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <label htmlFor="bio" className="label">Bio</label>
          <span className={`text-[11px] tabular-nums ${bio.length > 460 ? "text-amber-600" : "text-slate-400"}`}>
            {bio.length}/500
          </span>
        </div>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={500}
          className="input resize-y"
          placeholder="A short line about you (optional)."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>

      {error && <p className="field-error mt-5" role="alert">{error}</p>}

      <input type="hidden" name="avatarUrl" value={avatarUrl} />

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={isPending} className="btn-primary">
          <Save size={16} />
          {isPending ? "Saving…" : "Save changes"}
        </button>

        {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <CheckCircle2 size={16} />
              Saved
            </span>
          )}

        {isDirty && !isPending && !saved && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
            Unsaved changes
          </span>
        )}
      </div>
      </div>
    </form>
  );
}