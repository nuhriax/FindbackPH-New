"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Save } from "lucide-react";
import { updateProfileAction } from "@/lib/actions/profile";
import type { Profile } from "@/types/database";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  return (
    <form action={handleSubmit} className="card p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="label">First name</label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            maxLength={60}
            className="input"
            defaultValue={profile.first_name}
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
            defaultValue={profile.last_name}
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
          defaultValue={profile.username}
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
          defaultValue={profile.location ?? ""}
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
          defaultValue={profile.bio ?? ""}
        />
      </div>

      <div className="mt-5">
        <label htmlFor="avatarUrl" className="label">Profile photo URL</label>
        <input
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          maxLength={500}
          className="input"
          placeholder="https://… (optional)"
          defaultValue={profile.avatar_url ?? ""}
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
  );
}