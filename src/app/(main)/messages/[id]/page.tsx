"use client";

import { useState, useEffect, useRef, useTransition, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { sendMessageAction } from "@/lib/actions/messaging";
import { BlockUserButton } from "@/components/block-user-button";
import { CallOverlay, type CallMode } from "@/components/messaging/call-overlay";
import {
  Send,
  ArrowLeft,
  ArrowDown,
  ShieldAlert,
  Smile,
  ThumbsUp,
  Mic,
  Square,
  Trash2,
  Phone,
  Video,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

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
  /** 'text' (default) or 'audio' (recorded voice note). */
  kind?: "text" | "audio";
  audio_url?: string | null;
  audio_duration?: number | null;
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

export default function MessageThreadPage() {
  const routeParams = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [otherUser, setOtherUser] = useState<Participant | null>(null);
  const [itemTitle, setItemTitle] = useState<string>("Item");
  const [itemHref, setItemHref] = useState<string>("#");
  const [messages, setMessages] = useState<RawMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showSafetyReminder, setShowSafetyReminder] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const otherTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calls (WebRTC) — non-null while an outgoing/incoming call UI is mounted.
  const [callMode, setCallMode] = useState<CallMode | null>(null);

  // Voice-note recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [sendingVoice, setSendingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordStreamRef = useRef<MediaStream | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const conversationId = routeParams.id;
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
        .order("created_at", { ascending: true })
        .limit(200);

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

      // Mark messages as read via a security-definer RPC (the messages UPDATE
      // RLS policy only lets a user edit their own rows).
      await supabase.rpc("mark_messages_read", {
        p_conversation_id: conversationId,
      });
    };

    fetchData();
  }, [conversationId, supabase, router]);

  // Real-time subscription: new messages, read receipts, and typing indicator
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

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
          setMessages((prev) => {
            // Drop optimistic placeholder once the real message arrives
            const withoutPending = prev.filter(
              (m) => !(m.id.startsWith("pending-") && m.body === newMsg.body && m.sender_id === newMsg.sender_id)
            );
            if (withoutPending.some((m) => m.id === newMsg.id)) return withoutPending;
            return [...withoutPending, newMsg];
          });
          setPendingIds((prev) => {
            const next = new Set(prev);
            next.forEach((id) => {
              const m = messages.find((x) => x.id === id);
              if (m && m.body === newMsg.body) next.delete(id);
            });
            return next;
          });
          // Mark new incoming messages as read immediately
          if (newMsg.sender_id !== currentUserId) {
            void supabase.rpc("mark_messages_read", { p_conversation_id: conversationId });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as RawMessage;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, read_by_receiver: updated.read_by_receiver } : m))
          );
        }
      )
      .on(
        "broadcast",
        { event: "typing" },
        (payload) => {
          const { userId } = payload.payload as { userId: string };
          if (userId && userId !== currentUserId) {
            setOtherTyping(true);
            if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current);
            otherTypingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Expose the channel for typing broadcasts
          (channel as any)._broadcastReady = true;
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase, currentUserId, messages]);

  // Track scroll position to show/hide the "jump to latest" button
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      if (!el) return;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(distanceFromBottom > 160);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Scroll the MESSAGES container only — never the whole page. Using the
    // container's own scroll height avoids the page lurching down when a new
    // message is sent or received.
    const el = scrollerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const scrollToLatest = () => {
    const el = scrollerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  // Broadcast typing indicator to the other participant
  const broadcastTyping = () => {
    if (!currentUserId) return;
    const ch = supabase.getChannels().find((c) => c.topic === `realtime:messages:${conversationId}`);
    void ch?.send({ type: "broadcast", event: "typing", payload: { userId: currentUserId } });
  };

  function handleSendMessage(formData: FormData) {
    const body = (formData.get("body")?.toString() ?? "").trim();
    if (!body) return;
    startTransition(async () => {
      // Optimistic message — appears instantly with a pending state
      const optimistic: RawMessage = {
        id: `pending-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: currentUserId ?? "",
        body,
        read_by_receiver: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setPendingIds((prev) => new Set(prev).add(optimistic.id));
      setNewMessage("");
      const result = await sendMessageAction(conversationId, body);
      if (result?.error) console.error("Send error:", result.error);
    });
  }

  // --- Voice notes -----------------------------------------------------------

  const cleanupRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    recordStreamRef.current?.getTracks().forEach((t) => t.stop());
    recordStreamRef.current = null;
    mediaRecorderRef.current = null;
    recordChunksRef.current = [];
    setRecordSeconds(0);
  };

  const startRecording = async () => {
    setRecordError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recordChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordChunksRef.current.push(e.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      recordTimerRef.current = setInterval(
        () => setRecordSeconds((s) => s + 1),
        1000
      );
    } catch (err) {
      console.error("[voice] mic access failed:", err);
      setRecordError("Microphone access was blocked. Allow it in your browser settings.");
    }
  };

  const stopRecording = (send: boolean) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    const duration = Math.max(recordSeconds, 1);

    recorder.onstop = async () => {
      // Grab the recorded data BEFORE cleanup wipes the chunk buffer.
      const blob = new Blob(recordChunksRef.current, { type: "audio/webm" });
      cleanupRecording();
      setIsRecording(false);
      if (!send || blob.size === 0) return; // cancelled / empty take

      setSendingVoice(true);
      try {
        const path = `${currentUserId}/voice_${Date.now()}.webm`;
        const { error: uploadError } = await supabase.storage
          .from("voice-messages")
          .upload(path, blob, { contentType: "audio/webm" });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("voice-messages")
          .getPublicUrl(path);

        // Optimistic bubble (empty body + audio fields)
        const optimistic: RawMessage = {
          id: `pending-voice-${Date.now()}`,
          conversation_id: conversationId,
          sender_id: currentUserId ?? "",
          body: "",
          read_by_receiver: false,
          kind: "audio",
          audio_url: urlData.publicUrl,
          audio_duration: duration,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimistic]);
        setPendingIds((prev) => new Set(prev).add(optimistic.id));

        const result = await sendMessageAction(conversationId, "", {
          audioUrl: urlData.publicUrl,
          duration,
        });
        if (result?.error) console.error("Voice send error:", result.error);
      } catch (err) {
        console.error("[voice] upload failed:", err);
        setRecordError("Couldn't upload the voice note. Try again.");
      } finally {
        setSendingVoice(false);
      }
    };
    recorder.stop();
  };

  const fmtRec = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (loading) {
    return (
      <div className="py-12 lg:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="card flex h-[70vh] flex-col overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-200/70 px-4 py-3">
              <div className="skeleton h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <div className="skeleton h-4 w-36" />
                <div className="skeleton h-3 w-24" />
              </div>
            </div>
            <div className="flex-1 space-y-3 p-6">
              {[64, 80, 56].map((w, i) => (
                <div key={i} className={`skeleton h-10 w-[${w}%] rounded-2xl`} style={{ width: `${w}%` }} />
              ))}
            </div>
            <div className="border-t border-slate-200/70 p-4">
              <div className="skeleton h-11 w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!conversation) return null;

  const displayName = otherUser
    ? `${otherUser.first_name || ""} ${otherUser.last_name || ""}`.trim() || "Member"
    : "User";

  // Group messages: consecutive messages from the same sender share an avatar.
  const seenReceiptIndex = (() => {
    // Index of the last own message that the other party has read (for ✓✓ seen).
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.sender_id === currentUserId) {
        return m.read_by_receiver ? i : -1;
      }
    }
    return -1;
  })();

  const dateLabel = (d: Date) => {
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMM d, yyyy");
  };

  const lastOwnMessageId = [...messages].reverse().find((m) => m.sender_id === currentUserId)?.id;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Messenger-style chat header */}
      <div className="flex items-center gap-3 border-b border-slate-200/70 bg-white px-3 py-2.5 sm:px-4">
        <Link href="/messages" className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy-900 lg:hidden" aria-label="Back to chats">
          <ArrowLeft size={18} />
        </Link>
        <Link href={`/member/${otherUser?.id ?? ""}`} className="flex min-w-0 items-center gap-3">
          <span className="relative shrink-0">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-electric-500 to-electric-600 text-sm font-semibold text-white">
              {otherUser?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={otherUser.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </span>
            <span aria-hidden="true" className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-navy-900">{displayName}</span>
            <span className="block truncate text-xs text-slate-500">
              about{" "}
              <span className="font-medium text-blue-600 hover:underline">{itemTitle}</span>
            </span>
          </span>
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {otherUser && (
            <>
              <button
                type="button"
                onClick={() => setCallMode("audio")}
                aria-label={`Voice call ${displayName}`}
                title="Voice call"
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-electric-50 hover:text-electric-600"
              >
                <Phone size={18} />
              </button>
              <button
                type="button"
                onClick={() => setCallMode("video")}
                aria-label={`Video call ${displayName}`}
                title="Video call"
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-electric-50 hover:text-electric-600"
              >
                <Video size={18} />
              </button>
            </>
          )}
          {otherUser && (
            <Link
              href={`/member/${otherUser.id}`}
              className="hidden rounded-full px-3 py-1.5 text-xs font-semibold text-electric-600 transition-colors hover:bg-electric-50 sm:block"
            >
              View profile
            </Link>
          )}
          {otherUser && <BlockUserButton targetUserId={otherUser.id} />}
        </div>
      </div>

      {/* Contextual safety reminder — calm, one line, closeable */}
      {showSafetyReminder && (
        <div className="flex items-start gap-2 border-b border-amber-200/60 bg-amber-50/70 px-4 py-2 text-[11px] leading-4 text-amber-800">
          <ShieldAlert size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
          <p className="min-w-0 flex-1 text-amber-800">
            <span className="font-bold">Safety reminder.</span> Never send money, OTPs, or banking
            information. FindBackPH will never ask for your password.
          </p>
          <button
            type="button"
            onClick={() => setShowSafetyReminder(false)}
            aria-label="Dismiss safety reminder"
            className="shrink-0 rounded p-0.5 font-bold text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-800"
          >
            ✕
          </button>
        </div>
      )}

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Messages list */}
          <div ref={scrollerRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-electric-500 to-electric-600 text-xl font-semibold text-white">
                  {otherUser?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={otherUser.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </span>
                <p className="mt-4 font-display text-base font-semibold text-navy-900">{displayName}</p>
                <p className="mt-1 max-w-xs text-sm text-slate-500">
                  You and {displayName.split(" ")[0]} are talking about{" "}
                  <Link href={itemHref} className="font-medium text-blue-600 hover:underline">
                    {itemTitle}
                  </Link>
                  . Say hello 👋
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {messages.map((msg, i) => {
                  const isOwn = msg.sender_id === currentUserId;
                  const isPending = msg.id.startsWith("pending-");
                  const prev = i > 0 ? messages[i - 1] : null;
                  const msgDate = new Date(msg.created_at);
                  const prevDate = prev ? new Date(prev.created_at) : null;
                  const newDay = !prevDate || prevDate.toDateString() !== msgDate.toDateString();
                  const grouped =
                    !!prev && !newDay && prev.sender_id === msg.sender_id &&
                    msgDate.getTime() - prevDate.getTime() < 5 * 60 * 1000;
                  const time = format(msgDate, "h:mm a");
                  return (
                    <div key={msg.id}>
                      {newDay && (
                        <div className="flex justify-center py-3">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {dateLabel(msgDate)}
                          </span>
                        </div>
                      )}
                      <div className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
                        {!isOwn && (
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-electric-500 to-electric-600 text-[10px] font-semibold text-white ${
                              grouped ? "opacity-0" : ""
                            }`}
                          >
                            {otherUser?.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={otherUser.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              displayName.charAt(0).toUpperCase()
                            )}
                          </span>
                        )}
                        <div
                          title={`${isOwn ? "Sent" : "Received"} at ${time}`}
                          className={`max-w-[78%] rounded-3xl px-3.5 py-2 ${
                            grouped
                              ? isOwn ? "rounded-br-lg" : "rounded-bl-lg"
                              : isOwn ? "rounded-br-md" : "rounded-bl-md"
                          } ${
                            isOwn
                              ? isPending
                                ? "bg-electric-400/70 text-white"
                                : "bg-electric-600 text-white"
                              : "border border-slate-200/80 bg-slate-100 text-navy-900"
                          }`}
                        >
                          {msg.kind === "audio" && msg.audio_url ? (
                            <div className="flex min-w-[220px] items-center gap-2 py-0.5">
                              <span
                                aria-hidden="true"
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/10"
                              >
                                <Mic size={14} />
                              </span>
                              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                              <audio
                                controls
                                preload="metadata"
                                src={msg.audio_url}
                                className="h-9 w-44 min-w-0"
                              />
                              {!!msg.audio_duration && (
                                <span className="shrink-0 text-[11px] font-medium opacity-70">
                                  {fmtRec(msg.audio_duration)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">{msg.body}</p>
                          )}
                          {isPending && (
                            <div className="mt-1 flex justify-end">
                              <span className="text-[10px] font-medium text-white/70">Sending…</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Seen receipt under your last message */}
                {seenReceiptIndex >= 0 && lastOwnMessageId && (
                  <div className="flex justify-end pr-1 pt-1">
                    <span className="text-[11px] font-medium text-slate-400">
                      Seen {format(new Date(messages[seenReceiptIndex].created_at), "h:mm a")}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Typing indicator — animated dots, Messenger-style */}
          {otherTyping && (
            <div className="flex items-end gap-2 px-4 pb-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-electric-500 to-electric-600 text-[10px] font-semibold text-white">
                {otherUser?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={otherUser.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </span>
              <div className="rounded-3xl rounded-bl-md border border-slate-200/80 bg-slate-100 px-3 py-2.5">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                </span>
              </div>
            </div>
          )}

          {/* Jump-to-latest button — appears when scrolled up */}
          {showScrollBtn && (
            <div className="flex justify-center pb-2">
              <button
                type="button"
                onClick={scrollToLatest}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-md transition hover:bg-slate-50"
              >
                <ArrowDown size={14} />
                New messages
              </button>
            </div>
          )}

          {/* Messenger-style composer */}
          <div className="border-t border-slate-200/70 bg-white p-3 sm:px-4">
            {isRecording ? (
              /* Voice-note recording bar */
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 shrink-0 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
                <span className="shrink-0 font-mono text-sm font-semibold text-red-600">
                  {fmtRec(recordSeconds)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-500">
                  Recording… press send to deliver
                </span>
                <button
                  type="button"
                  onClick={() => stopRecording(false)}
                  disabled={sendingVoice}
                  aria-label="Discard voice note"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-red-600 disabled:opacity-40"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => stopRecording(true)}
                  disabled={sendingVoice || recordSeconds < 1}
                  aria-label="Send voice note"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-electric-600 text-white transition hover:bg-electric-500 disabled:opacity-40"
                >
                  <Send size={18} />
                </button>
              </div>
            ) : (
              <form ref={formRef} action={handleSendMessage} className="flex items-center gap-1.5">
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-electric-600 sm:flex"
                >
                  <Smile size={20} />
                </button>
                <input
                  name="body"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    // Debounced typing broadcast
                    if (!isTyping) {
                      setIsTyping(true);
                      broadcastTyping();
                    }
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      formRef.current?.requestSubmit();
                    }
                  }}
                  placeholder="Aa"
                  aria-label={`Message ${displayName}`}
                  className="w-full min-w-0 flex-1 rounded-full border border-transparent bg-slate-100 px-4 py-2 text-[15px] text-navy-900 placeholder:text-slate-400 transition focus:border-electric-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric-200"
                  maxLength={2000}
                  required
                />
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={sendingVoice}
                  aria-label="Record a voice message"
                  title="Record a voice message"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-electric-600 transition hover:bg-electric-50 disabled:opacity-40"
                >
                  <Mic size={18} />
                </button>
                {newMessage.trim() ? (
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-electric-600 transition hover:bg-electric-50 disabled:opacity-40"
                    aria-label="Send message"
                  >
                    <Send size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const input = formRef.current?.elements.namedItem("body") as HTMLInputElement | null;
                      if (input) input.value = "👍";
                      formRef.current?.requestSubmit();
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-electric-600 transition hover:bg-electric-50"
                    aria-label="Send a thumbs up"
                  >
                    <ThumbsUp size={18} />
                  </button>
                )}
              </form>
            )}
            {recordError && (
              <p className="mt-1.5 px-1 text-xs text-red-600" role="alert">
                {recordError}
              </p>
            )}
          </div>
        </div>

      {/* Voice / video call overlay (WebRTC) */}
      {currentUserId && otherUser && (
        <CallOverlay
          key={`${conversationId}:${callMode ?? "listen"}`}
          conversationId={conversationId}
          currentUserId={currentUserId}
          displayName={displayName}
          avatarUrl={otherUser.avatar_url}
          requestedMode={callMode}
          onClosed={() => setCallMode(null)}
        />
      )}
    </div>
  );
}
// END_OF_FILE