import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NotificationsList } from "@/components/notifications/notifications-list";
import type { Notification } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
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
    <div className="py-16 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <span className="section-eyebrow">Your FindBack updates</span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-900">Notifications</h1>
        <p className="mt-2 text-sm text-slate-500">
          Updates about your reports, matches, and messages.
        </p>

        <div className="mt-8">
          <NotificationsList initial={(notifications ?? []) as Notification[]} />
        </div>
      </div>
    </div>
  );
}
