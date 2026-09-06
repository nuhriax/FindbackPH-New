import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Canonical messages list lives at /messages. This keeps old /dashboard/messages
// links (sidebar bookmarks, notification payloads) working.
export default function DashboardMessagesRedirect() {
  redirect("/messages");
}