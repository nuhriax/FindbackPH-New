"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/actions/admin";

/**
 * Marks a contact message as read.
 *
 * RLS on `contact_messages` grants admins SELECT only (no UPDATE policy), so —
 * exactly like `setUserSuspensionAction` — the caller's admin/moderator role is
 * verified server-side FIRST, then the write runs on the service role. The key
 * never leaves the server.
 *
 * Used directly as a `<form action>` handler, so it returns void; failures are
 * logged server-side.
 */
export async function markMessageReadAction(messageId: string): Promise<void> {
  const authorized = await isAdminUser();
  if (!authorized) return;

  const service = createServiceRoleClient();
  const { error } = await service
    .from("contact_messages")
    .update({ status: "read" })
    .eq("id", messageId);

  if (error) {
    console.error("Mark contact message read error:", error);
    return;
  }

  revalidatePath("/admin/messages");
}

/** Marks every contact message as read (one click "inbox zero"). */
export async function markAllMessagesReadAction(): Promise<void> {
  const authorized = await isAdminUser();
  if (!authorized) return;

  const service = createServiceRoleClient();
  const { error } = await service
    .from("contact_messages")
    .update({ status: "read" })
    .eq("status", "new");

  if (error) {
    console.error("Mark all contact messages read error:", error);
    return;
  }

  revalidatePath("/admin/messages");
}
