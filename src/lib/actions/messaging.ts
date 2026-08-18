"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string } | { error?: undefined };
export type ConversationData = {
  id: string;
  item_type: "lost_item" | "found_item";
  item_id: string;
  participant_a: string;
  participant_b: string;
  created_at: string;
  updated_at: string;
};

export type MessageData = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

/**
 * Ensures a conversation exists for the given item between the current user
 * and the item's reporter. Returns the existing or newly-created conversation.
 */
export async function getOrCreateConversation(
  itemType: "lost_item" | "found_item",
  itemId: string
): Promise<ConversationData | { error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to message" };
  }

  const tableName = itemType === "lost_item" ? "lost_items" : "found_items";

  const { data: item, error: itemError } = await supabase
    .from(tableName)
    .select("id, reporter_id")
    .eq("id", itemId)
    .single();

  if (itemError || !item) {
    return { error: "Item not found" };
  }

  const reporterId = item.reporter_id;

  if (reporterId === user.id) {
    return { error: "You cannot message yourself" };
  }

  const [pA, pB] = user.id < reporterId ? [user.id, reporterId] : [reporterId, user.id];

  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("item_type", itemType)
    .eq("item_id", itemId)
    .eq("participant_a", pA)
    .eq("participant_b", pB)
    .maybeSingle();

  if (existing) {
    return existing as ConversationData;
  }

  const { data: created, error: createError } = await supabase
    .from("conversations")
    .insert({
      item_type: itemType,
      item_id: itemId,
      participant_a: pA,
      participant_b: pB,
    })
    .select("*")
    .single();

  if (createError || !created) {
    return { error: "Could not start conversation" };
  }

  revalidatePath("/messages");
  return created as ConversationData;
}

/**
 * Sends a message in an existing conversation.
 */
export async function sendMessageAction(
  conversationId: string,
  body: string
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to send messages" };
  }

  const trimmed = body.trim();
  if (!trimmed) {
    return { error: "Message cannot be empty" };
  }

  const { data: convo, error: convoError } = await supabase
    .from("conversations")
    .select("participant_a, participant_b")
    .eq("id", conversationId)
    .single();

  if (convoError || !convo) {
    return { error: "Conversation not found" };
  }

  const isParticipant = convo.participant_a === user.id || convo.participant_b === user.id;
  if (!isParticipant) {
    return { error: "You are not part of this conversation" };
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: trimmed,
  });

  if (error) {
    return { error: "Failed to send message" };
  }

  revalidatePath(`/messages/${conversationId}`);
  return {};
}
// PART2_MARKER

/**
 * Returns all conversations for the current user, newest first.
 */
export async function getUserConversations(): Promise<ConversationData[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("conversations")
    .select(`
      *,
      messages!inner(
        id,
        body,
        sender_id,
        created_at,
        read_by_receiver
      )
    `)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }

  return (data ?? []) as ConversationData[];
}

/**
 * Returns all messages for a conversation if the current user is a participant.
 */
export async function getMessages(conversationId: string): Promise<MessageData[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: convo, error: convoError } = await supabase
    .from("conversations")
    .select("participant_a, participant_b")
    .eq("id", conversationId)
    .single();

  if (convoError || !convo) return [];

  const isParticipant = convo.participant_a === user.id || convo.participant_b === user.id;
  if (!isParticipant) return [];

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }

  return (data ?? []) as MessageData[];
}

/**
 * Marks all messages in a conversation as read for the current user.
 */
export async function markMessagesRead(conversationId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("messages")
    .update({ read_by_receiver: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id);
}

/**
 * Returns unread notification count for the current user.
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) {
    console.error("Error counting notifications:", error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Returns recent notifications for the current user.
 */
export async function getNotifications(): Promise<any[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return data ?? [];
}

/**
 * Marks a notification as read.
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  revalidatePath("/notifications");
}

/**
 * Deletes a conversation (and its messages) for the current user.
 */
export async function deleteConversationAction(conversationId: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in" };

  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`);

  if (error) {
    console.error("Error deleting conversation:", error);
    return { error: "Could not delete conversation" };
  }

  revalidatePath("/messages");
  return {};
}
/**
 * Marks every notification for the current user as read.
 */
export async function markAllNotificationsRead(): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("notifications").update({ read: true }).eq("user_id", user.id);

  revalidatePath("/notifications");
  revalidatePath("/dashboard/notifications");
}