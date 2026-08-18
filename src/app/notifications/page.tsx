import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, PackageCheck, ShieldAlert, HeartHandshake } from "lucide-react";

export const dynamic = "force-dynamic";

function notificationIcon(type: string) {
  if (type === "match") return { Icon: PackageCheck, cls: "border-emerald-200 bg-emerald-50 text-emerald-600" };
  if (type === "flag") return { Icon: ShieldAlert, cls: "border-amber-200 bg-amber-50 text-amber-600" };
  if (type === "found") return { Icon: HeartHandshake, cls: "border-blue-200 bg-blue-50 text-blue-600" };
  return { Icon: Bell, cls: "border-indigo-200 bg-indigo-50 text-indigo-600" };
}

export default async function NotificationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notifications:", error);
    return (
      <div className="py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <span className="section-eyebrow">Your FindBack updates</span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-900">Notifications</h1>
          <p className="mt-4 text-slate-600">Something went wrong. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="section-eyebrow">Your FindBack updates</span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-900">Notifications</h1>
            <p className="mt-2 text-sm text-slate-500">
              Updates about your reports, matches, and messages.
            </p>
          </div>
        </div>

        {!notifications || notifications.length === 0 ? (
          <div className="mt-8 rounded-card border border-slate-200/70 bg-white/70 p-12 text-center shadow-soft backdrop-blur-md">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-600">
              <Bell size={24} />
            </div>
            <h2 className="mt-5 font-display text-lg font-semibold text-navy-900">You&apos;re all caught up</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
              We&apos;ll notify you here when there are matches, messages, or updates to your reports.
            </p>
            <div className="mt-6">
              <Link href="/dashboard" className="btn-primary">
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-2.5">
            {(notifications ?? []).map((n: any) => {
              const { Icon, cls } = notificationIcon(n.type);
              const isRead = !!n.read;
              return (
                <Link
                  key={n.id}
                  href={n.link ?? "/dashboard"}
                  className={`card flex items-start gap-4 p-4 transition-all duration-200 hover:-translate-y-px hover:shadow-card-hover ${
                    isRead ? "opacity-70" : "border-blue-200/80"
                  }`}
                >
                  <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${cls}`}>
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-navy-900">{n.title}</h3>
                      {!isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                    <span className="mt-1.5 inline-block text-xs text-slate-500">
                      {new Date(n.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
