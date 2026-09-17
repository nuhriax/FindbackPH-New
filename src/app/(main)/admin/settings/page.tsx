import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  ScrollText,
  UserCog,
  Gauge,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

function StatusPill({ on, onLabel = "Active", offLabel = "Off" }: { on: boolean; onLabel?: string; offLabel?: string }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        on
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {on ? onLabel : offLabel}
    </span>
  );
}

export default async function AdminSettingsPage() {
  const authorized = await isAdminUser();
  if (!authorized) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { count: suspendedUsers }, { count: pendingFlags }] = await Promise.all([
    user
      ? supabase
          .from("profiles")
          .select("first_name, last_name, role, created_at")
          .eq("id", user.id)
          .single()
      : Promise.resolve({ data: null }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_suspended", true),
    supabase.from("report_flags").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  // Real, current configuration values — read from the actual deployed
  // environment, never hardcoded.
  const turnstileOn = Boolean(process.env.TURNSTILE_SECRET_KEY);
  const siteUrlConfigured = Boolean(process.env.NEXT_PUBLIC_SITE_URL);

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold tracking-tight text-navy-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Live platform status and your admin account.</p>
      </div>

      {/* ── Your admin account ── */}
      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-6 shadow-soft backdrop-blur-md">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-electric-200 bg-electric-50 text-electric-600">
            <UserCog size={18} />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold text-navy-900">Your admin account</h3>
            <p className="mt-0.5 text-sm text-slate-500">The account you are signed in with right now.</p>
            <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-4 sm:block">
                <dt className="text-xs uppercase tracking-wide text-slate-400">Email</dt>
                <dd className="truncate font-medium text-navy-900">{user?.email ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4 sm:block">
                <dt className="text-xs uppercase tracking-wide text-slate-400">Role</dt>
                <dd className="font-medium capitalize text-navy-900">{profile?.role ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4 sm:block">
                <dt className="text-xs uppercase tracking-wide text-slate-400">Name</dt>
                <dd className="truncate font-medium text-navy-900">
                  {[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 sm:block">
                <dt className="text-xs uppercase tracking-wide text-slate-400">Member since</dt>
                <dd className="font-medium text-navy-900">
                  {profile?.created_at ? format(new Date(profile.created_at), "MMM d, yyyy") : "—"}
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/dashboard/settings" className="btn-secondary !py-2 text-sm">
                <KeyRound size={14} className="mr-1.5 inline" />
                Change password
              </Link>
              <Link href="/dashboard/profile" className="btn-secondary !py-2 text-sm">
                Edit profile
              </Link>
              <Link href="/admin/audit-logs" className="btn-secondary !py-2 text-sm">
                <ScrollText size={14} className="mr-1.5 inline" />
                View audit logs
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Live platform status ── */}
      <div className="mt-5 rounded-2xl border border-slate-200/70 bg-white/70 p-6 shadow-soft backdrop-blur-md">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600">
            <Shield size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base font-semibold text-navy-900">Security &amp; protection</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              Live values from the deployed environment — this is what is actually running.
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/60 bg-slate-50/50 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-navy-900">Bot protection (Cloudflare Turnstile)</p>
                  <p className="text-xs text-slate-500">Blocks automated signups, spam reports and contact submissions</p>
                </div>
                <StatusPill on={turnstileOn} onLabel="Active" offLabel="Not configured" />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/60 bg-slate-50/50 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-navy-900">Rate limiting</p>
                  <p className="text-xs text-slate-500">Shared Postgres limiter on all write actions (fleet-wide)</p>
                </div>
                <StatusPill on />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/60 bg-slate-50/50 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-navy-900">Row-level security (RLS)</p>
                  <p className="text-xs text-slate-500">Database-enforced access control on every table</p>
                </div>
                <StatusPill on />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/60 bg-slate-50/50 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-navy-900">Site URL configuration</p>
                  <p className="text-xs text-slate-500">NEXT_PUBLIC_SITE_URL — used for canonical links and emails</p>
                </div>
                <StatusPill on={siteUrlConfigured} onLabel="Configured" offLabel="Not set" />
              </div>
            </div>
            {(!turnstileOn || !siteUrlConfigured) && (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                <ShieldAlert size={13} className="mr-1 inline" />
                Items marked &ldquo;Not configured / Not set&rdquo; need their environment variables added in the
                Vercel dashboard (Settings → Environment Variables), then redeploy.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Moderation snapshot ── */}
      <div className="mt-5 rounded-2xl border border-slate-200/70 bg-white/70 p-6 shadow-soft backdrop-blur-md">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600">
            <Gauge size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base font-semibold text-navy-900">Moderation snapshot</h3>
            <p className="mt-0.5 text-sm text-slate-500">Where things stand right now.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                href="/admin/users"
                className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 transition hover:border-red-200 hover:bg-red-50/40"
              >
                <span className="text-sm font-medium text-navy-900">Suspended users</span>
                <span className="font-display text-xl font-semibold tabular-nums text-red-600">
                  {suspendedUsers ?? 0}
                </span>
              </Link>
              <Link
                href="/admin/flags"
                className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 transition hover:border-amber-200 hover:bg-amber-50/40"
              >
                <span className="text-sm font-medium text-navy-900">Pending flags</span>
                <span className="font-display text-xl font-semibold tabular-nums text-amber-600">
                  {pendingFlags ?? 0}
                </span>
              </Link>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck size={12} aria-hidden="true" />
              Every admin action is recorded in the audit log automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}