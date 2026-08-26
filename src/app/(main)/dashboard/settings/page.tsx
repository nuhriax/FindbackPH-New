"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, Bell, CheckCircle2, KeyRound, Mail, ShieldCheck, Trash2 } from "lucide-react";
import { changePasswordAction, deleteAccountAction } from "@/lib/actions/settings";
import { MatchAlertPrefs } from "@/components/dashboard/match-alert-prefs";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <span className="section-eyebrow">Your account</span>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-navy-900">
        Settings
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
        Manage your password, security, and account preferences.
      </p>

      <div className="mt-8 space-y-6">
        <AccountDetailsCard />
        <ChangePasswordCard />
        <MatchAlertPrefs />
        <NotificationsPrefsCard />
        <PrivacyCard />
        <DeleteAccountCard />
      </div>
    </div>
  );
}

function ChangePasswordCard() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await changePasswordAction(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        (document.getElementById("settings-password") as HTMLFormElement | null)?.reset();
      }
    });
  }

  return (
    <section className="card p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600">
          <KeyRound size={18} />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold text-navy-900">Change password</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Use at least 8 characters with an uppercase letter and a number.
          </p>
        </div>
      </div>

      <form id="settings-password" action={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="password" className="label">New password</label>
          <input id="password" name="password" type="password" required className="input" />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="label">Confirm new password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" required className="input" />
        </div>

        {error && <p className="field-error" role="alert">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={isPending} className="btn-primary">
            {isPending ? "Updating…" : "Update password"}
          </button>
          {success && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <CheckCircle2 size={16} />
              Password updated
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
function AccountDetailsCard() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
    };
    run();
  }, []);

  return (
    <section className="card p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600">
          <Mail size={18} />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold text-navy-900">Account &amp; email</h2>
          <p className="mt-0.5 text-sm text-slate-500">The email we use to sign you in and reach you.</p>
          <div className="mt-4 rounded-xl border border-slate-200/70 bg-slate-50/60 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Email address</p>
            <p className="mt-0.5 text-sm font-medium text-navy-900">{email ?? "Loading…"}</p>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            To change your email, sign out and reset your password, or contact support. Your email is
            never shown publicly on FindBack PH.
          </p>
        </div>
      </div>
    </section>
  );
}

const PREF_KEY = "fb-notif-prefs";
const PREF_DEFAULTS = { matches: true, messages: true, returned: true, digest: false };

function NotificationsPrefsCard() {
  const [prefs, setPrefs] = useState<typeof PREF_DEFAULTS>(() => {
    if (typeof window === "undefined") return PREF_DEFAULTS;
    try {
      return { ...PREF_DEFAULTS, ...(JSON.parse(localStorage.getItem(PREF_KEY) ?? "{}") as Partial<typeof PREF_DEFAULTS>) };
    } catch {
      return PREF_DEFAULTS;
    }
  });

  function toggle(key: keyof typeof PREF_DEFAULTS) {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(PREF_KEY, JSON.stringify(next));
      return next;
    });
  }

  const ROWS: { key: keyof typeof PREF_DEFAULTS; title: string; desc: string }[] = [
    { key: "matches", title: "Possible matches", desc: "When a found item may match one of your lost reports." },
    { key: "messages", title: "Messages", desc: "When someone starts or replies to a conversation with you." },
    { key: "returned", title: "Item returned", desc: "When a report you contacted is marked as returned." },
    { key: "digest", title: "Weekly digest", desc: "A summary of activity every Monday morning." },
  ];

  return (
    <section className="card p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600">
          <Bell size={18} />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold text-navy-900">Notification preferences</h2>
          <p className="mt-0.5 text-sm text-slate-500">Choose which updates you want to receive.</p>
        </div>
      </div>

      <div className="mt-5 divide-y divide-slate-100">
        {ROWS.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium text-navy-900">{row.title}</p>
              <p className="text-xs text-slate-500">{row.desc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[row.key]}
              aria-label={row.title}
              onClick={() => toggle(row.key)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                prefs[row.key] ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  prefs[row.key] ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <p className="mt-2 text-xs text-slate-500">
        These preferences are stored on this device. In-app notifications always appear on the
        Notifications page.
      </p>
    </section>
  );
}

function PrivacyCard() {
  return (
    <section className="card p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600">
          <ShieldCheck size={18} />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold text-navy-900">Privacy &amp; security</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Learn how we protect your information and what we store.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/privacy" className="btn-secondary !py-2 text-sm">Privacy policy</a>
            <a href="/terms" className="btn-secondary !py-2 text-sm">Terms of service</a>
            <a href="/safety" className="btn-secondary !py-2 text-sm">Safety guide</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function DeleteAccountCard() {
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const ready = confirmText === "DELETE";

  function handleDelete() {
    if (!ready) return;
    setError(null);
    if (!window.confirm("This will permanently delete your account and all of your reports. Continue?")) {
      return;
    }
    startTransition(async () => {
      const result = await deleteAccountAction();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <section className="rounded-card border border-red-200/80 bg-red-50/50 p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-100 text-red-600">
          <Trash2 size={18} />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold text-navy-900">Delete account</h2>
          <p className="mt-0.5 text-sm leading-6 text-slate-600">
            Permanently remove your account, profile, and all associated reports. This cannot be
            undone.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="delete-confirm" className="label">
          Type <span className="font-semibold">DELETE</span> to confirm
        </label>
        <input
          id="delete-confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          type="text"
          className="input"
          placeholder="DELETE"
        />
      </div>

      {error && <p className="field-error mt-3" role="alert">{error}</p>}

      <button
        type="button"
        disabled={!ready || isPending}
        onClick={handleDelete}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <AlertTriangle size={15} />
        {isPending ? "Deleting…" : "Delete my account"}
      </button>
    </section>
  );
}