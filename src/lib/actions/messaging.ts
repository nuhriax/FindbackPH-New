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

export type RailItem = {
  id: string;
  displayName: string;
  initial: string;
  avatarUrl: string | null;
  timeLabel: string;
  preview: string;
  isUnread: boolean;
};

/**
 * Ensures a conversation exists for the given item between the current user
 * and the item's reporter. Returns the existing or newly-created conversation.
 */
export async function getOrCreateConversation(
  itemType: "lost_item" | "found_item",
  itemId: string
): Promise<ConversationData | { error: string }> {
  const supabase = await createClient();
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

  // Block enforcement — either direction blocks new conversations.
  const { data: blockRow } = await supabase
    .from("blocked_users")
    .select("blocker_id")
    .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${reporterId}),and(blocker_id.eq.${reporterId},blocked_id.eq.${user.id})`)
    .limit(1);

  if (blockRow && blockRow.length > 0) {
    return { error: "Messaging isn't available between these accounts" };
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
 * Sends a message in an existing conversation. Pass `voice` to send a
 * recorded voice note instead of text (body stays empty).
 */
export async function sendMessageAction(
  conversationId: string,
  body: string,
  voice?: { audioUrl: string; duration: number }
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to send messages" };
  }

  const trimmed = body.trim();
  if (!trimmed && !voice) {
    return { error: "Message cannot be empty" };
  }
  if (!trimmed && voice && (!voice.audioUrl || !Number.isFinite(voice.duration) || voice.duration <= 0)) {
    return { error: "Invalid voice note" };
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

  // Block enforcement — either direction blocks sending.
  const otherId = convo.participant_a === user.id ? convo.participant_b : convo.participant_a;
  const { data: blockRow } = await supabase
    .from("blocked_users")
    .select("blocker_id")
    .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${otherId}),and(blocker_id.eq.${otherId},blocked_id.eq.${user.id})`)
    .limit(1);

  if (blockRow && blockRow.length > 0) {
    return { error: "Messaging isn't available between these accounts" };
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: trimmed,
    ...(voice
      ? {
          kind: "audio" as const,
          audio_url: voice.audioUrl,
          audio_duration: Math.max(1, Math.round(voice.duration)),
        }
      : {}),
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
  const supabase = await createClient();
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
        kind,
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
  const supabase = await createClient();
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
    .order("created_at", { ascending: true })
    .limit(200);

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Marks messages as read via a security-definer RPC. The messages UPDATE RLS
  // policy only allows editing your own rows, so marking the OTHER party's
  // messages read goes through mark_messages_read (verifies participation).
  await supabase.rpc("mark_messages_read", { p_conversation_id: conversationId });
}

/**
 * Returns unread notification count for the current user.
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
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
 * Splits the unread-notification count into "general" (matches, updates,
 * moderation, ...) and "messages" so the navbar can show separate Messenger-
 * style badges on the bell and the chat icon that never overlap.
 */
export async function getUnreadCounts(): Promise<{ general: number; messages: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { general: 0, messages: 0 };

  const [messagesRes, othersRes] = await Promise.all([
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false)
      .eq("type", "new_message"),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false)
      .neq("type", "new_message"),
  ]);

  if (messagesRes.error) console.error("Error counting message notifications:", messagesRes.error);
  if (othersRes.error) console.error("Error counting general notifications:", othersRes.error);

  return { general: othersRes.count ?? 0, messages: messagesRes.count ?? 0 };
}

export type ConversationPreview = {
  id: string;
  item_type: "lost_item" | "found_item";
  /** Title of the lost/found report the conversation is about. */
  item_title: string | null;
  other_id: string;
  other_name: string;
  other_avatar_url: string | null;
  latest_body: string | null;
  latest_from_me: boolean;
  /** True when the newest message is theirs and hasn't been read yet. */
  has_unread: boolean;
  updated_at: string;
};

/**
 * Compact conversation summaries for the navbar's Messenger-style dropdown:
 * the five most recent threads with counterpart profile and latest message.
 */
export async function getConversationPreviews(limit = 5): Promise<ConversationPreview[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("conversations")
    .select(
      `id, item_type, item_id, participant_a, participant_b, updated_at,
       messages(body, kind, sender_id, read_by_receiver, created_at)`
    )
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order("updated_at", { ascending: false })
    // Only the most recent message per conversation is needed for a preview.
    .order("created_at", { ascending: false, referencedTable: "messages" })
    .limit(1, { referencedTable: "messages" })
    .limit(limit);

  if (error || !data) {
    console.error("Error fetching conversation previews:", error);
    return [];
  }

  type PreviewRow = {
    id: string;
    item_type: "lost_item" | "found_item";
    item_id: string;
    participant_a: string;
    participant_b: string;
    updated_at: string;
    messages?: Array<{
      body: string;
      kind?: "text" | "audio" | null;
      sender_id: string;
      read_by_receiver: boolean | null;
      created_at: string;
    }>;
  };

  const rows = data as unknown as PreviewRow[];

  const previewText = (m?: { body: string; kind?: "text" | "audio" | null }) =>
    m && (m.kind === "audio" || (!m.body.trim() && !!m.kind))
      ? "🎤 Voice message"
      : m?.body ?? null;

  return Promise.all(
    rows.map(async (row) => {
      const otherId = row.participant_a === user.id ? row.participant_b : row.participant_a;

      const [profileRes, itemRes] = await Promise.all([
        supabase.from("profiles").select("first_name, last_name, avatar_url").eq("id", otherId).single(),
        (() => {
          const table = row.item_type === "lost_item" ? "lost_items" : "found_items";
          return supabase.from(table).select("title").eq("id", row.item_id).single();
        })(),
      ]);

      const profile = profileRes.data as { first_name: string; last_name: string; avatar_url: string | null } | null;
      const latest = row.messages?.[0];

      return {
        id: row.id,
        item_type: row.item_type,
        item_title: ((itemRes.data as { title: string } | null)?.title ?? null),
        other_id: otherId,
        other_name: profile?.first_name
          ? `${profile.first_name} ${profile.last_name}`.trim()
          : "Someone",
        other_avatar_url: profile?.avatar_url ?? null,
        latest_body: previewText(latest),
        latest_from_me: latest ? latest.sender_id === user.id : false,
        has_unread: !!latest && latest.sender_id !== user.id && !latest.read_by_receiver,
        updated_at: row.updated_at,
      } satisfies ConversationPreview;
    })
  );
}

/**
 * Returns recent notifications for the current user.
 */
export async function getNotifications(): Promise<any[]> {
  const supabase = await createClient();
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
 * Returns enriched conversation items for the two-pane chat rail.
 * Server-action shaped so the client <ChatsRail> can fetch it on its own
 * without crossing the server→client component boundary.
 */
export async function getRailItems(): Promise<RailItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("conversations")
    .select(
      `id, item_type, item_id, participant_a, participant_b, updated_at,
       messages(body, kind, sender_id, read_by_receiver, created_at)`
    )
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false, referencedTable: "messages" })
    .limit(1, { referencedTable: "messages" })
    .limit(100);

  if (!data) return [];

  const items = await Promise.all(
    data.map(async (row: any) => {
      const otherId = row.participant_a === user.id ? row.participant_b : row.participant_a;
      const [profileRes, itemRes] = await Promise.all([
        supabase.from("profiles").select("first_name, last_name, avatar_url").eq("id", otherId).single(),
        (() => {
          const table = row.item_type === "lost_item" ? "lost_items" : "found_items";
          return supabase.from(table).select("title").eq("id", row.item_id).single();
        })(),
      ]);
      const profile = profileRes.data as { first_name: string; last_name: string; avatar_url: string | null } | null;
      const latest = row.messages?.[0];
      const unreadCount =
        (row.messages as any[] | undefined)?.filter(
          (m) => m && m.sender_id !== user.id && !m.read_by_receiver
        ).length ?? 0;
      const displayName = profile?.first_name
        ? `${profile.first_name} ${profile.last_name ?? ""}`.trim()
        : "Someone";

      return {
        id: row.id,
        displayName,
        initial: (profile?.first_name?.[0] ?? "S").toUpperCase(),
        avatarUrl: profile?.avatar_url ?? null,
        timeLabel: latest?.created_at ? String(latest.created_at) : "",
        preview: latest
          ? `${latest.sender_id === user.id ? "You: " : ""}${
              latest.kind === "audio" ? "🎤 Voice message" : latest.body
            }`
          : itemRes.data
            ? `About ${(itemRes.data as { title: string }).title}`
            : "Say hello — no messages yet",
        isUnread: unreadCount > 0,
      } satisfies Omit<RailItem, "isActive">;
    })
  );

  return items;
}

/**
 * Marks a notification as read.
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("notifications").update({ read: true }).eq("user_id", user.id);

  revalidatePath("/notifications");
  revalidatePath("/dashboard/notifications");
}