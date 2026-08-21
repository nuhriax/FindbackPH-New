"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, CheckCircle2, Loader2, Save, Trash2 } from "lucide-react";
import { updateProfileAction, uploadAvatarAction, removeAvatarAction } from "@/lib/actions/profile";
import type { Profile } from "@/types/database";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSaved, setAvatarSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(profile.first_name ?? "");
  const [lastName, setLastName] = useState(profile.last_name ?? "");
  const [username, setUsername] = useState(profile.username ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");

  const filled = [firstName.trim(), lastName.trim(), username.trim(), location.trim(), bio.trim()].filter(Boolean).length;
  const completion = Math.round((filled / 5) * 100);
  const initial = (firstName || username || "U").charAt(0).toUpperCase();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
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
    const fd = new FormData();
    fd.set("avatar", file);
    const result = await uploadAvatarAction(fd);
    setUploading(false);
    if (result?.error) {
      setAvatarError(result.error);
      return;
    }
    if (result.avatarUrl) {
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
    <div className="space-y-5">
      {/* Public preview */}
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-blue-200 bg-blue-50 text-2xl font-semibold text-blue-700">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </span>
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold text-navy-900">
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : "Your full name"}
            </p>
            <p className="truncate text-sm text-slate-500">@{username || "yourname"}</p>
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{bio || "Add a short bio…"}</p>
          </div>
        </div>

        <div className="flex-1 sm:ml-auto sm:max-w-[220px]">
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

      <form action={handleSubmit} className="card p-6 sm:p-8">
        <label className="label">Profile photo</label>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Preview */}
          <div className="relative">
            <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-blue-200 bg-blue-50 text-3xl font-semibold text-blue-700">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </span>
            {avatarSaved && (
              <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
                <CheckCircle2 size={14} />
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn-primary !py-2.5 text-sm"
              >
                {uploading ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
                {uploading ? "Uploading…" : "Upload photo"}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={15} />
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              id="avatarFile"
              name="avatarFile"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Upload a photo from your device. JPG, PNG, WebP, or GIF up to 4 MB. Your photo is
              shown next to your reports and in conversations.
            </p>
            {avatarError && <p className="mt-2 text-xs font-medium text-red-600">{avatarError}</p>}
          </div>
        </div>

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
        <label htmlFor="username" className="label">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          required
          minLength={3}
          maxLength={30}
          className="input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <p className="mt-1.5 text-xs text-slate-500">
          Letters, numbers, and underscores only. Others may see this on your reports.
        </p>
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
      </div>

      <div className="mt-5">
        <label htmlFor="bio" className="label">Bio</label>
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

      <div className="mt-7 flex items-center gap-3">
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
      </div>
      </form>
    </div>
  );
}