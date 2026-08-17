import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

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
          <h1 className="font-display text-3xl font-bold text-white">Notifications</h1>
          <p className="mt-4 text-slate-400">Something went wrong. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-white">Notifications</h1>

        {!notifications || notifications.length === 0 ? (
          <div className="mt-8 card p-8 text-center">
            <p className="text-slate-400">You have no notifications yet.</p>
            <p className="mt-2 text-sm text-slate-500">
              We'll notify you when there are updates to your reports.
            </p>
            <div className="mt-4">
              <Link href="/dashboard" className="btn-primary">
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-2">
            {(notifications ?? []).map((n: any) => (
              <Link
                key={n.id}
                href={n.link ?? "/dashboard"}
                className={`card flex items-start gap-4 p-4 transition-colors hover:border-electric-500/30 ${
                  n.read ? "opacity-60" : "border-electric-500/30"
                }`}
              >
                <div className="flex-1">
                  <h3 className="font-medium text-white">{n.title}</h3>
                  <p className="mt-1 text-sm text-slate-300">{n.message}</p>
                  <span className="text-xs text-slate-500">
                    {new Date(n.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {!n.read && (
                  <span className="h-2 w-2 flex-shrink-0 rounded-full bg-electric-500" />
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
