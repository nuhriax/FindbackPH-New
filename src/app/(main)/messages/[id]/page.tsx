"use client";

import { useState, useEffect, useRef, useTransition, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendMessageAction } from "@/lib/actions/messaging";
import { Send, ArrowLeft } from "lucide-react";

type Participant = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
};

type RawMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_by_receiver: boolean;
  created_at: string;
};

type Conversation = {
  id: string;
  item_type: "lost_item" | "found_item";
  item_id: string;
  participant_a: string;
  participant_b: string;
  created_at: string;
  updated_at: string;
  messages?: RawMessage[];
};

export default function MessageThreadPage({ params }: { params: { id: string } }) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [otherUser, setOtherUser] = useState<Participant | null>(null);
  const [itemTitle, setItemTitle] = useState<string>("Item");
  const [itemHref, setItemHref] = useState<string>("#");
  const [messages, setMessages] = useState<RawMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const conversationId = params.id;
// MARKER_SPLIT

  // Fetch conversation and initial messages
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch conversation
      const { data: convo, error: convoError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .maybeSingle();

      if (convoError || !convo) {
        router.push("/messages");
        return;
      }

      const isParticipant =
        convo.participant_a === user.id || convo.participant_b === user.id;
      if (!isParticipant) {
        router.push("/messages");
        return;
      }

      // Get other user
      const otherId =
        convo.participant_a === user.id ? convo.participant_b : convo.participant_a;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, first_name, last_name, avatar_url")
        .eq("id", otherId)
        .single();

      setOtherUser(profile);

      // Fetch messages
      const { data: msgs, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (msgError) console.error("Error:", msgError);
      setMessages(msgs ?? []);
      setConversation(convo);

      // Fetch related item
      const tableName = convo.item_type === "lost_item" ? "lost_items" : "found_items";
      const { data: item } = await supabase
        .from(tableName)
        .select("title")
        .eq("id", convo.item_id)
        .single();

      if (item) {
        setItemTitle(item.title);
        setItemHref(
          convo.item_type === "lost_item"
            ? `/lost/${convo.item_id}`
            : `/found/${convo.item_id}`
        );
      }

      setLoading(false);

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ read_by_receiver: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id);
    };

    fetchData();
  }, [conversationId, supabase, router]);

  // Real-time subscription to new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as RawMessage;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSendMessage(formData: FormData) {
    startTransition(async () => {
      const result = await sendMessageAction(
        conversationId,
        formData.get("body")?.toString() ?? ""
      );
      if (result?.error) console.error("Send error:", result.error);
      setNewMessage("");
    });
  }

  if (loading) {
    return (
      <div className="py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-slate-600">Loading conversation…</p>
        </div>
      </div>
    );
  }

  if (!conversation) return null;

  const displayName = otherUser
    ? `${otherUser.first_name || ""} ${otherUser.last_name || ""}`.trim() ||
      otherUser.username
    : "User";
// MARKER_SPLIT2

  return (
    <div className="py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/messages" className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-blue-50 hover:text-navy-900">
            <ArrowLeft size={20} />
          </Link>
          <Link
            href={itemHref}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Item: {itemTitle}
          </Link>
        </div>

        <div className="card flex h-[600px] sm:h-[700px] flex-col overflow-hidden">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-ice-50/60 to-white/40 p-6">
            {messages.length === 0 ? (
              <p className="pt-8 text-center text-sm text-slate-600">
                No messages yet. Start the conversation below.
              </p>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                        isOwn
                          ? "ml-auto rounded-br-md bg-gradient-to-b from-electric-500 to-electric-600 text-white"
                          : "rounded-bl-md border border-slate-200/70 bg-white text-navy-900"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.body}</p>
                      <span className={`mt-1 block text-xs ${isOwn ? "text-white/75" : "text-slate-500"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message input */}
          <div className="border-t border-slate-200/70 bg-white/80 p-4 backdrop-blur">
            <form action={handleSendMessage} className="flex items-center gap-2">
              <input
                name="body"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message ${displayName}...`}
                className="input !py-2.5"
                maxLength={2000}
                required
              />
              <button
                type="submit"
                disabled={isPending || !newMessage.trim()}
                className="btn-primary !px-3.5 !py-2.5"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
// END_OF_FILE