import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Canonical notifications list lives at /notifications. This keeps old
// /dashboard/notifications links working.
export default function DashboardNotificationsRedirect() {
  redirect("/notifications");
}