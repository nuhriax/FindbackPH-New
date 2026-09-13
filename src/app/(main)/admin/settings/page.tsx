import { notFound } from "next/navigation";
import { Settings as SettingsIcon, Shield } from "lucide-react";
import { isAdminUser } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const authorized = await isAdminUser();
  if (!authorized) notFound();

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold tracking-tight text-navy-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Platform configuration and moderation preferences.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-6 shadow-soft backdrop-blur-md">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-electric-200 bg-electric-50 text-electric-600">
            <SettingsIcon size={18} />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-navy-900">Moderation Settings</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              Configure how content is moderated and flagged across the platform.
            </p>
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-slate-200/60 bg-slate-50/50 p-4">
          <p className="text-sm text-slate-600">
            Moderation settings are managed through the database and Supabase dashboard.
            Contact the system administrator for configuration changes.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200/70 bg-white/70 p-6 shadow-soft backdrop-blur-md">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600">
            <Shield size={18} />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-navy-900">Security</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              Platform security and access control settings.
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50/50 p-4">
            <div>
              <p className="text-sm font-medium text-navy-900">Role-based access</p>
              <p className="text-xs text-slate-500">Admin and moderator roles enforced via database RLS</p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50/50 p-4">
            <div>
              <p className="text-sm font-medium text-navy-900">Server-side authorization</p>
              <p className="text-xs text-slate-500">All admin actions verified server-side before execution</p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}