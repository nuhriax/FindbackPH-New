"use client";

import { useState, useEffect, useRef, useTransition, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { sendMessageAction } from "@/lib/actions/messaging";
import { BlockUserButton } from "@/components/block-user-button";
import { CallOverlay, type CallMode } from "@/components/messaging/call-overlay";
import { EmojiPicker } from "@/components/messaging/emoji-picker";
import { VoicePlayer } from "@/components/messaging/voice-player";
import { CameraCapture } from "@/components/messaging/camera-capture";
import {
  Send,
  ArrowLeft,
  ArrowDown,
  ShieldAlert,
  Smile,
  Heart,
  Mic,
  Square,
  Trash2,
  Phone,
  Video,
  Check,
  CheckCheck,
  ImagePlus,
  Camera,
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
  /** 'text' (default), 'audio' (voice note), 'image' (photo) or 'video'. */
  kind?: "text" | "audio" | "image" | "video";
  audio_url?: string | null;
  audio_duration?: number | null;
  image_url?: string | null;
  video_url?: string | null;
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
  const [sendingImage, setSendingImage] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [waveBars, setWaveBars] = useState<number[]>(() => Array(28).fill(0.15));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  // Codec actually negotiated for the current take — used for the Blob type,
  // upload contentType and file extension. Safari can't play WebM/Opus and
  // Chrome doesn't record MP4, so we pick per-browser at record time.
  const recordMimeRef = useRef<string>("audio/webm");
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // Emoji picker popover
  const [showEmoji, setShowEmoji] = useState(false);
  // Local user's own identity (used to announce the caller on outgoing calls)
  const [selfName, setSelfName] = useState<string>("Someone");

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

      // Own display name (announced to the callee on outgoing calls)
      const { data: ownProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();
      if (ownProfile) {
        const n = `${ownProfile.first_name ?? ""} ${ownProfile.last_name ?? ""}`.trim();
        if (n) setSelfName(n);
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
            // Drop our optimistic placeholder(s) for this message once the real
            // row arrives (matched by sender + kind; a fast sender can have a
            // couple queued, so remove the first match of that kind).
            const idx = prev.findIndex(
              (m) =>
                m.id.startsWith("pending-") &&
                m.sender_id === newMsg.sender_id &&
                (m.kind ?? "text") === (newMsg.kind ?? "text")
            );
            if (idx === -1) {
              return prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg];
            }
            const next = [...prev];
            if (prev.some((m) => m.id === newMsg.id)) {
              // already have the real row — just drop the placeholder
              next.splice(idx, 1);
              return next;
            }
            next[idx] = newMsg; // replace placeholder with the real message
            return next;
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
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    recordStreamRef.current?.getTracks().forEach((t) => t.stop());
    recordStreamRef.current = null;
    mediaRecorderRef.current = null;
    recordChunksRef.current = [];
    setRecordSeconds(0);
    setWaveBars(Array(28).fill(0.15));
  };

  /** Live microphone waveform driven by an AnalyserNode + rAF. */
  const startWaveform = (stream: MediaStream) => {
    try {
      const ctx = new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;
      const buf = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!analyserRef.current) {
          void ctx.close();
          return;
        }
        analyserRef.current.getByteFrequencyData(buf);
        const step = Math.floor(buf.length / 28) || 1;
        setWaveBars(
          Array.from({ length: 28 }, (_, i) => {
            const v = buf[i * step] / 255;
            return Math.max(0.12, Math.min(1, v * 1.6));
          })
        );
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      /* waveform is decorative — recording still works without it */
    }
  };

  /**
 * Best recording codec the current browser supports — AND can play back.
 * Safari records/plays MP4/AAC but not WebM/Opus; Chrome/Edge record WebM
 * (some also support MP4, but their MP4 output historically lacked duration
 * metadata, so WebM is preferred there). Order matters: first match wins.
 */
const RECORD_MIME_CANDIDATES = [
  "audio/webm;codecs=opus", // Chrome/Edge/Firefox — best compression
  "audio/webm",
  "audio/mp4;codecs=mp4a.40.2", // Safari / iOS
  "audio/mp4",
] as const;

function pickRecordMime(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  for (const mime of RECORD_MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return ""; // let the browser choose its default
}

const startRecording = async () => {
    setRecordError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordStreamRef.current = stream;
      startWaveform(stream);
      const mimeType = pickRecordMime();
      recordMimeRef.current = mimeType || "audio/webm";
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
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
      const mimeType = recordMimeRef.current || "audio/webm";
      const ext = mimeType.includes("mp4") ? "m4a" : "webm";
      const blob = new Blob(recordChunksRef.current, { type: mimeType });
      cleanupRecording();
      setIsRecording(false);
      if (!send || blob.size === 0) return; // cancelled / empty take

      setSendingVoice(true);
      try {
        const path = `${currentUserId}/voice_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("voice-messages")
          .upload(path, blob, { contentType: mimeType });
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

  // --- Image messages ---------------------------------------------------------

  /**
   * Downscales an image file to max 1600px on its longest edge and re-encodes
   * as JPEG — keeps chat uploads fast and storage small. Falls back to the
   * original file if decoding fails (e.g. exotic formats).
   */
  const prepareImage = (file: Blob): Promise<Blob> =>
    new Promise((resolve) => {
      const max = 1600;
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        // Small enough already and not a huge PNG — send as-is.
        if (scale === 1 && file.size < 1.5 * 1024 * 1024) {
          resolve(file);
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => resolve(blob && blob.size > 0 ? blob : file),
          "image/jpeg",
          0.85
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };
      img.src = objectUrl;
    });

  const sendImage = async (media: Blob) => {
    if (!media.type.startsWith("image/")) {
      setRecordError("Please pick an image file.");
      return;
    }
    if (media.size > 15 * 1024 * 1024) {
      setRecordError("Image is too large (max 15 MB).");
      return;
    }
    setRecordError(null);
    setSendingImage(true);
    try {
      const blob = await prepareImage(media);
      const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
      const path = `${currentUserId}/img_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("chat-images")
        .upload(path, blob, { contentType: blob.type || "image/jpeg" });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("chat-images")
        .getPublicUrl(path);

      const optimistic: RawMessage = {
        id: `pending-img-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: currentUserId ?? "",
        body: "",
        read_by_receiver: false,
        kind: "image",
        image_url: urlData.publicUrl,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setPendingIds((prev) => new Set(prev).add(optimistic.id));

      const { error: insertError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: currentUserId ?? "",
        body: "",
        kind: "image",
        image_url: urlData.publicUrl,
      });
      if (insertError) throw insertError;
    } catch (err) {
      console.error("[image] send failed:", err);
      setRecordError("Couldn't send the image. Try again.");
      // Drop the optimistic bubble so the user isn't stuck with a ghost photo.
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("pending-img-")));
    } finally {
      setSendingImage(false);
    }
  };

  const onImagePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (file) void sendImage(file);
  };

  /**
   * Uploads image OR video bytes and inserts the corresponding message row.
   * In-app camera (photo/video) routes here.
   */
  const sendMedia = async (media: Blob) => {
    const isVideo = media.type.startsWith("video/");
    const isImage = media.type.startsWith("image/");
    if (!isVideo && !isImage) {
      setRecordError("Unsupported media type.");
      return;
    }
    if (media.size > 20 * 1024 * 1024) {
      setRecordError("Media is too large (max 20 MB).");
      return;
    }
    setRecordError(null);
    setSendingImage(true);
    try {
      const bucket = isVideo ? "chat-videos" : "chat-images";
      const slug = isVideo ? "vid" : "img";
      const ext = isVideo
        ? media.type.includes("webm")
          ? "webm"
          : "mp4"
        : media.type === "image/png"
          ? "png"
          : media.type === "image/webp"
            ? "webp"
            : "jpg";
      const content = isVideo ? media : await prepareImage(media);
      const path = `${currentUserId}/${slug}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, content, { contentType: content.type || (isVideo ? "video/webm" : "image/jpeg") });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      const kind = isVideo ? "video" : "image";
      const idTag = isVideo ? "pending-vid" : "pending-img";
      const optimistic: RawMessage = {
        id: `${idTag}-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: currentUserId ?? "",
        body: "",
        read_by_receiver: false,
        kind,
        ...(isVideo ? { video_url: urlData.publicUrl } : { image_url: urlData.publicUrl }),
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setPendingIds((prev) => new Set(prev).add(optimistic.id));

      const { error: insertError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: currentUserId ?? "",
        body: "",
        kind,
        ...(isVideo ? { video_url: urlData.publicUrl } : { image_url: urlData.publicUrl }),
      });
      if (insertError) throw insertError;
    } catch (err) {
      console.error(`[${isVideo ? "video" : "image"}] send failed:`, err);
      setRecordError(isVideo ? "Couldn't send the video. Try again." : "Couldn't send the image. Try again.");
      // Drop the optimistic bubble so the user isn't stuck with a ghost media.
      setMessages((prev) => prev.filter((m) => !(m.id.startsWith("pending-img-") || m.id.startsWith("pending-vid-"))));
    } finally {
      setSendingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col">
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
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-200/70 bg-white px-4 py-3 shadow-[0_1px_6px_rgba(2,44,44,0.05)] sm:px-5">
        <Link href="/messages" className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy-900 lg:hidden" aria-label="Back to chats">
          <ArrowLeft size={18} />
        </Link>
        <Link href={`/member/${otherUser?.id ?? ""}`} className="flex min-w-0 items-center gap-3">
          <span className="relative shrink-0">
            <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full msg-gradient text-sm font-semibold text-white">
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
            <span className="block truncate text-[15px] font-semibold leading-tight text-navy-900">{displayName}</span>
            <span className="mt-0.5 block truncate text-xs text-slate-500">
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
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
              >
                <Phone size={18} />
              </button>
              <button
                type="button"
                onClick={() => setCallMode("video")}
                aria-label={`Video call ${displayName}`}
                title="Video call"
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
              >
                <Video size={18} />
              </button>
            </>
          )}
          {otherUser && (
            <Link
              href={`/member/${otherUser.id}`}
              className="hidden rounded-full px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 sm:block"
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
          <div ref={scrollerRef} className="chat-thread-scroll chat-wall-light flex-1 overflow-y-auto px-3 py-4 sm:px-6">
            {messages.length === 0 ? (
              <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-6 text-center">
                <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full msg-gradient text-xl font-semibold text-white shadow-lg shadow-blue-500/20">
                  {otherUser?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={otherUser.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </span>
                <p className="mt-4 font-display text-lg font-semibold text-navy-900">{displayName}</p>
                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">
                  You and {displayName.split(" ")[0]} are talking about{" "}
                  <Link href={itemHref} className="font-medium text-blue-600 hover:underline">
                    {itemTitle}
                  </Link>
                  . Say hello 👋
                </p>
              </div>
            ) : (
              <div className="mx-auto w-full max-w-3xl space-y-2">
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
                  const isCallLog = msg.body.startsWith("📞");
                  const isMedia = msg.kind === "image" || msg.kind === "video";
                  return (
                    <div key={msg.id}>
                      {newDay && (
                        <div className="flex justify-center py-3">
                          <span className="rounded-full bg-white/85 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 shadow-sm backdrop-blur-sm">
                            {dateLabel(msgDate)}
                          </span>
                        </div>
                      )}
                      {isCallLog ? (
                        /* Call log chip — Messenger-style centered system line */
                        <div className="flex justify-center py-1">
                          <span className="rounded-full border border-slate-200/70 bg-white/85 px-3.5 py-1 text-[12px] font-medium text-slate-500 shadow-sm backdrop-blur-sm">
                            {msg.body}
                          </span>
                        </div>
                      ) : (
                      <div className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
                        {!isOwn && (
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full msg-gradient text-[10px] font-semibold text-white ${
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
                          className={`max-w-[85%] overflow-hidden rounded-2xl sm:max-w-[72%] ${
                            grouped
                              ? isOwn ? "rounded-br-sm" : "rounded-bl-sm"
                              : isOwn ? "rounded-br-md" : "rounded-bl-md"
                          } ${isMedia ? "p-1.5" : "px-3.5 py-2.5"} ${
                            isMedia
                              ? isOwn
                                ? "msg-gradient"
                                : "border border-slate-200/60 bg-white shadow-sm"
                              : isOwn
                                ? isPending
                                  ? "msg-gradient-soft text-white shadow-sm"
                                  : "msg-gradient text-white shadow-sm"
                                : "border border-slate-200/60 bg-white text-navy-900 shadow-sm"
                          }`}
                        >
                          {msg.kind === "video" && msg.video_url ? (
                            <video
                              src={msg.video_url}
                              controls
                              playsInline
                              preload="metadata"
                              className="max-h-80 w-auto max-w-[260px] rounded-xl bg-black sm:max-w-[300px]"
                            />
                          ) : msg.kind === "image" && msg.image_url ? (
                            <a
                              href={msg.image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block overflow-hidden rounded-xl"
                              aria-label="Open shared photo"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={msg.image_url}
                                alt="Shared photo"
                                loading="lazy"
                                className="max-h-80 w-auto max-w-[240px] rounded-xl object-cover transition hover:opacity-95 sm:max-w-[300px]"
                              />
                            </a>
                          ) : msg.kind === "audio" && msg.audio_url ? (
                            <VoicePlayer src={msg.audio_url} duration={msg.audio_duration} dark={isOwn} />
                          ) : (
                            <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">{msg.body}</p>
                          )}
                          {isPending ? (
                            <div className="mt-1 flex justify-end">
                              <span className="text-[10px] font-medium text-white/70">Sending…</span>
                            </div>
                          ) : isOwn ? (
                            <div className="mt-0.5 flex items-center justify-end gap-1">
                              <span className="text-[10px] tabular-nums text-white/60">{time}</span>
                              {/* Read receipt: single ✓ = sent/delivered, blue ✓✓ = seen */}
                              {msg.read_by_receiver ? (
                                <CheckCheck size={13} aria-label="Seen" className="text-sky-200" />
                              ) : (
                                <Check size={13} aria-label="Sent" className="text-white/60" />
                              )}
                            </div>
                          ) : (
                            <div className="mt-0.5 flex justify-start">
                              <span className="text-[10px] tabular-nums text-slate-400">{time}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      )}
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
              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full msg-gradient text-[10px] font-semibold text-white">
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
          <div className="shrink-0 border-t border-slate-200/70 bg-white pt-2.5 shadow-[0_-1px_12px_rgba(2,44,44,0.08)] sm:pt-3">
            <div className="mx-auto w-full max-w-3xl px-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:px-4">{isRecording ? (
              /* Voice-note recording bar with live mic waveform */
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 shrink-0 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
                <span className="shrink-0 font-mono text-sm font-semibold text-red-600">
                  {fmtRec(recordSeconds)}
                </span>
                <div className="flex h-8 min-w-0 flex-1 items-center gap-[2px]" aria-hidden="true">
                  {waveBars.map((h, i) => (
                    <span
                      key={i}
                      className="w-[3px] shrink-0 rounded-full bg-red-400/70 transition-[height] duration-75"
                      style={{ height: `${Math.round(h * 100)}%` }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => stopRecording(false)}
                  disabled={sendingVoice}
                  aria-label="Discard voice note"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-red-600 disabled:opacity-40"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => stopRecording(true)}
                  disabled={sendingVoice || recordSeconds < 1}
                  aria-label="Send voice note"
                  className="flex h-10 w-10 shrink-0 items-center justify-center msg-gradient rounded-full text-white transition hover:opacity-90 disabled:opacity-40"
                >
                  <Send size={18} />
                </button>
              </div>
            ) : (
              <form ref={formRef} action={handleSendMessage} className="flex items-end gap-1.5">
                {/* Hidden picker: gallery file upload */}
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onImagePicked}
                  aria-hidden="true"
                  tabIndex={-1}
                />
                {/* Left action cluster — circular Messenger-style buttons */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={sendingVoice || sendingImage}
                    aria-label="Record a voice message"
                    title="Voice message"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-40"
                  >
                    <Mic size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={sendingImage || sendingVoice}
                    aria-label="Send an image"
                    title="Send an image"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-40"
                  >
                    <ImagePlus size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraOpen(true)}
                    disabled={sendingImage || sendingVoice}
                    aria-label="Take a photo"
                    title="Take a photo"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-40"
                  >
                    <Camera size={18} />
                  </button>
                </div>
                <textarea
                  name="body"
                  ref={(el) => {
                    // Auto-grow up to ~5 rows, Messenger-style.
                    const inputEl = el as HTMLTextAreaElement | null;
                    if (inputEl) {
                      inputEl.style.height = "auto";
                      inputEl.style.height = `${Math.min(inputEl.scrollHeight, 120)}px`;
                    }
                  }}
                  rows={1}
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
                  className="max-h-[120px] min-w-0 flex-1 resize-none rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[15px] leading-snug text-navy-900 shadow-sm placeholder:text-slate-400 transition focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  maxLength={2000}
                  required
                />
                {/* Right cluster — emoji sticker picker + quick heart (Messenger) */}
                <div className="relative flex shrink-0 items-center gap-1">
                  {newMessage.trim() ? (
                    <button
                      type="submit"
                      disabled={isPending}
                      className="flex h-10 w-10 items-center justify-center msg-gradient rounded-full text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
                      aria-label="Send message"
                    >
                      <Send size={18} />
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowEmoji((v) => !v)}
                        aria-label="Choose an emoji"
                        aria-expanded={showEmoji}
                        title="Stickers & emoji"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                      >
                        <Smile size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // Quick-heart like Messenger's like button. The
                          // textarea is controlled, but the form action reads
                          // the DOM value synchronously — same trick as 👍.
                          const input = formRef.current?.elements.namedItem("body") as HTMLTextAreaElement | null;
                          if (input) input.value = "❤️";
                          formRef.current?.requestSubmit();
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-rose-500 transition hover:bg-rose-50"
                        aria-label="Send a heart"
                        title="Send a heart"
                      >
                        <Heart size={20} className="fill-rose-500" />
                      </button>
                    </>
                  )}
                  {showEmoji && (
                    <EmojiPicker
                      onPick={(emoji) => {
                        setNewMessage((prev) => prev + emoji);
                      }}
                      onClose={() => setShowEmoji(false)}
                    />
                  )}
                </div>
              </form>
            )}
            {recordError && (
              <p className="mt-1.5 px-1 text-xs text-red-600" role="alert">
                {recordError}
              </p>
            )}
              </div>
          </div>
        </div>

      {/* Voice / video call overlay (WebRTC) — caller-initiated. Incoming
          calls from anywhere in the app are handled by <IncomingCallManager>. */}
      {currentUserId && otherUser && (
        <CallOverlay
          key={`${conversationId}:${callMode ?? "listen"}`}
          conversationId={conversationId}
          currentUserId={currentUserId}
          calleeId={otherUser.id}
          displayName={displayName}
          avatarUrl={otherUser.avatar_url}
          requestedMode={callMode}
          incomingOffer={null}
          selfName={displayName}
          onClosed={() => setCallMode(null)}
        />
      )}

      {/* In-app camera — real camera app: photo/video modes, front/back, flash */}
      {cameraOpen && (
        <CameraCapture
          onCapture={(blob) => {
            setCameraOpen(false);
            void sendMedia(blob);
          }}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </div>
  );
}
// END_OF_FILE