import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Saved items now live inside the dashboard workspace at /dashboard/saved.
 * This route remains only so old links (bookmarks, notifications, indexed
 * URLs) keep working.
 */
export default async function SavedItemsPage() {
  redirect("/dashboard/saved");
}
