"use client";

/**
 * FindBack PH — in-chat voice / video calling (WebRTC).
 *
 * Signaling runs over a Supabase Realtime broadcast channel keyed on the
 * CALLEE's user id (`call:u:<calleeId>`), so an incoming call rings the other
 * user anywhere in the app — not just inside the chat thread. The
 * <IncomingCallManager> listens on the current user's channel globally and
 * mounts this overlay to answer.
 *
 * When a call ends, a 📞 call-log message is posted into the conversation so
 * the thread keeps a Messenger-style history ("📞 Voice call · 1:23").
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessageAction } from "@/lib/actions/messaging";
import { startRingtone, stopRingtone } from "@/lib/ringtone";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react";

export type CallMode = "audio" | "video";

export type IncomingOffer = {
  from: string;
  mode: CallMode;
  sdp: RTCSessionDescriptionInit;
  callerName?: string;
  callerAvatar?: string | null;
};

type CallPhase =
  | "idle"
  | "calling"
  | "ringing"
  | "connecting"
  | "connected"
  | "ended";

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ],
};

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Fire-and-forget call-log entry written into the conversation. */
function logCall(conversationId: string, body: string) {
  void sendMessageAction(conversationId, body).catch(() => {
    /* call log is best-effort */
  });
}

export function CallOverlay({
  conversationId,
  currentUserId,
  calleeId,
  displayName,
  avatarUrl,
  requestedMode,
  incomingOffer,
  selfName,
  selfAvatar,
  onClosed,
}: {
  conversationId: string;
  currentUserId: string;
  /** The user id of the person being called (signaling channel key). */
  calleeId: string;
  displayName: string;
  avatarUrl: string | null;
  /** Set when the local user placed the call. */
  requestedMode: CallMode | null;
  /** Set when answering an offer received by the global listener. */
  incomingOffer: IncomingOffer | null;
  /** Local user's identity — included in the offer so the callee sees who's calling. */
  selfName?: string;
  selfAvatar?: string | null;
  onClosed: () => void;
}) {
  const supabase = useMemoClient();
  const isCaller = !!requestedMode && !incomingOffer;
  const [phase, setPhase] = useState<CallPhase>(requestedMode ? "calling" : incomingOffer ? "ringing" : "idle");
  const [mode, setMode] = useState<CallMode | null>(requestedMode ?? incomingOffer?.mode ?? null);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = useRef(false);
  const pendingOfferRef = useRef<IncomingOffer | null>(incomingOffer);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const roleRef = useRef<"caller" | "callee" | null>(isCaller ? "caller" : incomingOffer ? "callee" : null);
  const secondsRef = useRef(0);
  const modeRef = useRef<CallMode | null>(mode);
  const loggedRef = useRef(false);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  /** Write the thread call-log entry (once per call, caller side only). */
  const writeLog = useCallback(
    (kind: "ended" | "missed") => {
      if (loggedRef.current || !isCaller || !conversationId) return;
      loggedRef.current = true;
      const label = modeRef.current === "video" ? "Video call" : "Voice call";
      if (kind === "ended" && secondsRef.current > 0) {
        logCall(conversationId, `📞 ${label} · ${fmt(secondsRef.current)}`);
      } else if (kind === "missed") {
        logCall(conversationId, `📞 Missed ${label.toLowerCase()}`);
      } else {
        logCall(conversationId, `📞 ${label} ended`);
      }
    },
    [conversationId, isCaller]
  );

  /** Tear down media + peer connection. */
  const teardown = useCallback(() => {
    pcRef.current?.getSenders().forEach((s) => s.track?.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    remoteDescSetRef.current = false;
    pendingCandidatesRef.current = [];
    pendingOfferRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    stopRingtone();
  }, []);

  const hangup = useCallback(
    (broadcast = true) => {
      if (broadcast) {
        channelRef.current?.send({
          type: "broadcast",
          event: "hangup",
          payload: { from: currentUserId },
        });
      }
      writeLog(secondsRef.current > 0 ? "ended" : "missed");
      teardown();
      setPhase("ended");
      window.setTimeout(() => onClosed(), 1200);
    },
    [currentUserId, onClosed, teardown, writeLog]
  );

  /** Build the peer connection and wire media + ICE. */
  const createPeer = useCallback(
    async (callMode: CallMode) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callMode === "video" ? { width: { ideal: 1280 }, facingMode: "user" } : false,
      });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(ICE_CONFIG);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (ev) => {
        const remote = ev.streams[0];
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remote;
        const audioEl = document.getElementById("call-remote-audio") as HTMLAudioElement | null;
        if (audioEl && callMode === "audio") audioEl.srcObject = remote;
      };

      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          channelRef.current?.send({
            type: "broadcast",
            event: "ice",
            payload: { from: currentUserId, candidate: ev.candidate.toJSON() },
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          stopRingtone();
          setPhase("connected");
        }
        if (["failed", "closed"].includes(pc.connectionState) && pcRef.current) {
          hangup();
        }
      };

      pcRef.current = pc;
      return pc;
    },
    [currentUserId, hangup]
  );

  const drainCandidates = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || remoteDescSetRef.current) return;
    for (const c of pendingCandidatesRef.current) {
      try {
        await pc.addIceCandidate(c);
      } catch {
        /* stale candidate — ignore */
      }
    }
    pendingCandidatesRef.current = [];
  }, []);

  // Signaling channel — keyed on the callee's user id so it works app-wide.
  useEffect(() => {
    const channel = supabase.channel(`call:u:${calleeId}`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "call-answer" }, async ({ payload }) => {
        const { from, sdp } = payload as { from: string; sdp: RTCSessionDescriptionInit };
        if (from === currentUserId || roleRef.current !== "caller") return;
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        remoteDescSetRef.current = true;
        await drainCandidates();
        stopRingtone();
        setPhase("connecting");
      })
      .on("broadcast", { event: "call-decline" }, ({ payload }) => {
        const { from } = payload as { from: string };
        if (from === currentUserId || roleRef.current !== "caller") return;
        writeLog("missed");
        teardown();
        setError("Call declined");
        setPhase("ended");
        window.setTimeout(() => onClosed(), 1200);
      })
      .on("broadcast", { event: "ice" }, async ({ payload }) => {
        const { from, candidate } = payload as { from: string; candidate: RTCIceCandidateInit };
        if (from === currentUserId) return;
        const pc = pcRef.current;
        if (!pc) return;
        if (!remoteDescSetRef.current) {
          pendingCandidatesRef.current.push(candidate);
        } else {
          try {
            await pc.addIceCandidate(candidate);
          } catch {
            /* stale candidate — ignore */
          }
        }
      })
      .on("broadcast", { event: "hangup" }, ({ payload }) => {
        const { from } = payload as { from: string };
        if (from === currentUserId) return;
        teardown();
        setPhase("ended");
        window.setTimeout(() => onClosed(), 1200);
      })
      .subscribe();

    return () => {
      teardown();
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, currentUserId, calleeId]);

  // Caller dials as soon as the overlay mounts with a requested mode.
  useEffect(() => {
    if (!requestedMode || phase !== "calling") return;
    let cancelled = false;
    startRingtone("outgoing");
    (async () => {
      try {
        const pc = await createPeer(requestedMode);
        if (cancelled) return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        channelRef.current?.send({
          type: "broadcast",
          event: "call-offer",
          payload: {
            from: currentUserId,
            mode: requestedMode,
            sdp: offer,
            callerName: selfName,
            callerAvatar: selfAvatar ?? null,
          },
        });
      } catch (err) {
        console.error("[call] dial failed:", err);
        setError(
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Microphone/camera permission was blocked"
            : "Could not start the call"
        );
        setPhase("ended");
        window.setTimeout(() => onClosed(), 1500);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedMode]);

  // Callee: ring while the incoming offer waits; always silence on end.
  useEffect(() => {
    if (phase === "ringing") startRingtone("incoming");
    if (phase === "ended") stopRingtone();
  }, [phase]);

  // Auto-miss an unanswered ring after 30s.
  useEffect(() => {
    if (phase !== "calling" && phase !== "ringing") return;
    const t = window.setTimeout(() => {
      if (phase === "calling") {
        channelRef.current?.send({
          type: "broadcast",
          event: "hangup",
          payload: { from: currentUserId },
        });
        writeLog("missed");
        setError("No answer");
      } else {
        setError("Missed call");
      }
      teardown();
      setPhase("ended");
      window.setTimeout(() => onClosed(), 1200);
    }, 30_000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Connected: start the duration timer + bind the local camera preview.
  useEffect(() => {
    if (phase !== "connected") return;
    const t = window.setInterval(() => {
      setSeconds((s) => {
        secondsRef.current = s + 1;
        return s + 1;
      });
    }, 1000);
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    return () => window.clearInterval(t);
  }, [phase]);


  const acceptCall = async () => {
    const offer = pendingOfferRef.current;
    if (!offer || !mode) return;
    stopRingtone();
    setPhase("connecting");
    try {
      const pc = await createPeer(mode);
      roleRef.current = "callee";
      await pc.setRemoteDescription(new RTCSessionDescription(offer.sdp));
      remoteDescSetRef.current = true;
      await drainCandidates();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      channelRef.current?.send({
        type: "broadcast",
        event: "call-answer",
        payload: { from: currentUserId, sdp: answer },
      });
    } catch (err) {
      console.error("[call] accept failed:", err);
      channelRef.current?.send({
        type: "broadcast",
        event: "call-decline",
        payload: { from: currentUserId },
      });
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone/camera permission was blocked"
          : "Could not join the call"
      );
      teardown();
      setPhase("ended");
      window.setTimeout(() => onClosed(), 1500);
    }
  };

  const declineCall = () => {
    channelRef.current?.send({
      type: "broadcast",
      event: "call-decline",
      payload: { from: currentUserId },
    });
    // The CALLER writes the "Missed" log so both sides never double up.
    teardown();
    onClosed();
  };

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = muted;
      setMuted(!muted);
    }
  };

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = camOff;
      setCamOff(!camOff);
    }
  };

  if (phase === "idle") return null;

  const statusLabel =
    phase === "calling"
      ? `Calling ${displayName}…`
      : phase === "ringing"
        ? `Incoming ${mode === "video" ? "video" : "voice"} call`
        : phase === "connecting"
          ? "Connecting…"
          : phase === "connected"
            ? fmt(seconds)
            : error ?? "Call ended";

  const showVideo = mode === "video" && phase === "connected";

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-navy-950/95 backdrop-blur-md"
      role="dialog"
      aria-label={statusLabel}
    >
      {/* Remote feed (video) / avatar (voice) */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {mode === "video" ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`h-full w-full object-cover ${showVideo ? "" : "opacity-0"}`}
          />
        ) : (
          <audio id="call-remote-audio" autoPlay />
        )}

        {(!showVideo || !mode) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
            <span className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-electric-500 to-electric-600 text-4xl font-semibold text-white ring-4 ring-white/10">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                (displayName[0] ?? "?").toUpperCase()
              )}
              {(phase === "calling" || phase === "ringing") && (
                <span className="absolute inset-0 animate-ping rounded-full bg-electric-400/20" />
              )}
            </span>
            <div>
              <p className="font-display text-xl font-semibold text-white">{displayName}</p>
              <p className="mt-1 text-sm text-slate-300">{statusLabel}</p>
            </div>
          </div>
        )}

        {showVideo && (
          <>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-4 py-1.5 text-sm font-medium text-white backdrop-blur">
              {displayName} · {fmt(seconds)}
            </div>
            {/* Local camera PIP */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-4 right-4 h-40 w-32 rounded-2xl border border-white/15 object-cover shadow-xl sm:w-40"
            />
          </>
        )}

        {phase === "ended" && error && (
          <p className="absolute bottom-24 rounded-full bg-black/60 px-4 py-1.5 text-sm text-white">
            {error}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 border-t border-white/10 bg-black/40 px-6 py-6">
        {phase === "ringing" ? (
          <>
            <button
              type="button"
              onClick={declineCall}
              aria-label="Decline call"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
            >
              <PhoneOff size={22} />
            </button>
            <button
              type="button"
              onClick={acceptCall}
              aria-label="Accept call"
              className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:bg-emerald-600"
            >
              <Phone size={22} />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={toggleMute}
              disabled={phase !== "connected"}
              aria-label={muted ? "Unmute" : "Mute"}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition disabled:opacity-40 ${
                muted ? "bg-amber-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {muted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {mode === "video" && (
              <button
                type="button"
                onClick={toggleCamera}
                disabled={phase !== "connected"}
                aria-label={camOff ? "Turn camera on" : "Turn camera off"}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition disabled:opacity-40 ${
                  camOff ? "bg-amber-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {camOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>
            )}

            <button
              type="button"
              onClick={() => hangup()}
              aria-label="End call"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
            >
              <PhoneOff size={24} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Tiny helper so the component keeps one stable client instance. */
function useMemoClient() {
  const ref = useRef<ReturnType<typeof createClient> | null>(null);
  if (!ref.current) ref.current = createClient();
  return ref.current;
}
