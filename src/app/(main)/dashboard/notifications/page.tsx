import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NotificationsList } from "@/components/notifications/notifications-list";
import type { Notification } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardNotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <span className="section-eyebrow">Your updates</span>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-navy-900">
        Notifications
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
        Matches, messages, and updates about your reports.
      </p>

      <div className="mt-6">
        <NotificationsList initial={(notifications ?? []) as Notification[]} />
      </div>
    </div>
  );
}