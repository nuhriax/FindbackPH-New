"use client";

/**
 * Full-screen in-app camera (real camera app):
 *  - Photo & Video modes
 *  - Front ⇄ back camera swap
 *  - Flashlight (torch) on supported devices
 *  - Live viewfinder → capture → review (Retake/Send) for both photos & video
 * Emits the captured media as a Blob + kind ('image' | 'video') via onCapture.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  Clapperboard,
  RefreshCcw,
  RotateCcw,
  Send,
  Video,
  X,
  Zap,
  ZapOff,
} from "lucide-react";

type Mode = "photo" | "video";
type Media = { blob: Blob; url: string };

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function CameraCapture({
  onCapture,
  onClose,
  initialMode = "photo",
}: {
  onCapture: (blob: Blob, kind: "image" | "video") => void;
  onClose: () => void;
  initialMode?: Mode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const recChunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [mode, setMode] = useState<Mode>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [shooting, setShooting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [flashOn, setFlashOn] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const [shot, setShot] = useState<Media | null>(null);
  const [mounted, setMounted] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Free preview URLs when replaced/discarded.
  useEffect(() => {
    return () => {
      if (shot) URL.revokeObjectURL(shot.url);
    };
  }, [shot]);

  useEffect(() => setMounted(true), []);

  // Open the camera + (re)resolve flashlight support whenever facing changes.
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);
    setFlashOn(false);
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "Camera isn't available here. A secure connection (HTTPS or localhost) and camera permission are required."
        );
        return;
      }
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
            audio: true, // capture mic so video mode records sound
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        }
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
        // Torch (flashlight) is only a real thing on the REAR camera.
        if (facing === "environment") {
          const track = stream.getVideoTracks()[0];
          if (track) {
            const caps = track.getCapabilities?.() as { torch?: boolean } | undefined;
            setFlashSupported(!!caps?.torch);
          }
        } else {
          setFlashSupported(false);
        }
      } catch (err) {
        if (cancelled) return;
        const name = (err as DOMException)?.name;
        if (name === "NotAllowedError" || name === "SecurityError")
          setError("Camera access was blocked. Click the camera/lock icon in the address bar, allow camera, then reopen.");
        else if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "NotSupportedError" || name === "AbortError")
          setError("No camera was found on this device.");
        else if (name === "NotReadableError" || name === "TrackStartError")
          setError("Your camera is in use by another app. Close it and try again.");
        else setError("Couldn't start the camera. Reopen and try again.");
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing, attempt]);
const stopTimer = useCallback(() => {
    if (recTimerRef.current) {
      clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
  }, []);

  const toggleFlash = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !flashOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] } as unknown as MediaTrackConstraints);
      setFlashOn(next);
    } catch {
      setFlashOn(false);
    }
  }, [flashOn]);

  const stopRecording = useCallback(() => {
    const rec = recRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    stopTimer();
  }, [stopTimer]);

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || !ready) return;
    setShooting(true);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      if (facing === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          setShooting(false);
          if (blob && blob.size > 0) {
            video.pause();
            setShot({ blob, url: URL.createObjectURL(blob) });
          }
        },
        "image/jpeg",
        0.9
      );
    } else {
      setShooting(false);
    }
  }, [ready, facing]);

  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    const video = videoRef.current;
    if (!stream || !video || !ready) return;
    if (typeof MediaRecorder === "undefined") {
      setError("Video recording isn't supported in this browser.");
      return;
    }
    const mime = ["video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((m) =>
      MediaRecorder.isTypeSupported(m)
    );
    let rec: MediaRecorder;
    try {
      rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    } catch {
      rec = new MediaRecorder(stream);
    }
    recChunksRef.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) recChunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      stopTimer();
      const type = rec.mimeType || mime || "video/webm";
      const blob = new Blob(recChunksRef.current, { type });
      recChunksRef.current = [];
      video.pause();
      if (blob.size > 0) setShot({ blob, url: URL.createObjectURL(blob) });
      setRecording(false);
      setElapsed(0);
    };
    video.play().catch(() => {});
    rec.start();
    recRef.current = rec;
    setRecording(true);
    setElapsed(0);
    recTimerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  }, [ready, stopTimer]);

  const retake = useCallback(() => {
    setShot((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    videoRef.current?.play().catch(() => {});
  }, []);

  const confirmShot = useCallback(() => {
    if (shot) onCapture(shot.blob, shot.blob.type.startsWith("video") ? "video" : "image");
  }, [shot, onCapture]);

  // Cleanup recorder/timer when unmounting.
  useEffect(() => {
    return () => {
      stopTimer();
      if (recRef.current && recRef.current.state !== "inactive") {
        try {
          recRef.current.stop();
        } catch {
          /* ignore */
        }
      }
    };
  }, [stopTimer]);

  if (!mounted) return null;
return createPortal(
    <div role="dialog" aria-label="Camera" className="fixed inset-0 z-[80] flex flex-col bg-black">
      {error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="max-w-sm text-sm text-white/80">{error}</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAttempt((a) => a + 1)}
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white/85"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/15 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/25"
            >
              Close
            </button>
          </div>
        </div>
      ) : shot ? (
        <>
          {shot.blob.type.startsWith("video") ? (
            <video src={shot.url} controls autoPlay loop className="flex-1 w-full bg-black object-contain" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shot.url} alt="Captured photo" className="flex-1 w-full bg-black object-contain" />
          )}

          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-4 pb-12 pt-[max(1rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={retake}
              aria-label="Retake"
              title="Retake"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition active:scale-95 hover:bg-black/65"
            >
              <X size={20} />
            </button>
            <span className="rounded-full bg-black/50 px-3.5 py-1.5 text-xs font-semibold text-white/95 backdrop-blur-sm">
              {shot.blob.type.startsWith("video") ? "Send this video?" : "Send this photo?"}
            </span>
            <span className="h-11 w-11" />
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-7 pt-16 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={retake}
              aria-label="Retake"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition active:scale-95 hover:bg-black/65"
            >
              <RotateCcw size={22} />
            </button>
            <button
              type="button"
              onClick={confirmShot}
              aria-label="Send photo"
              className="flex h-16 items-center gap-2 rounded-full bg-electric-600 pl-6 pr-7 text-sm font-bold text-white shadow-lg shadow-black/40 transition active:scale-95 hover:bg-electric-500"
            >
              Send
              <Send size={20} />
            </button>
          </div>
        </>
      ) : (
<>
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`flex-1 w-full object-cover ${facing === "user" ? "scale-x-[-1]" : ""}`}
          />

          {recording && (
            <div className="absolute inset-x-0 top-4 z-20 flex justify-center">
              <span className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-sm font-semibold text-white tabular-nums">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                REC {fmt(elapsed)}
              </span>
            </div>
          )}

          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/70 via-black/25 to-transparent px-4 pb-12 pt-[max(1rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close camera"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition active:scale-95 hover:bg-black/65"
            >
              <X size={20} />
            </button>
            {mode === "photo" && facing === "environment" && flashSupported && (
              <button
                type="button"
                onClick={toggleFlash}
                aria-label={flashOn ? "Turn flashlight off" : "Turn flashlight on"}
                title="Flashlight"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition active:scale-95 hover:bg-black/65"
              >
                {flashOn ? <ZapOff size={20} className="text-amber-300" /> : <Zap size={20} />}
              </button>
            )}
          </div>

          {/* Bottom controls — real-camera-app layout */}
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between bg-gradient-to-t from-black/70 via-black/25 to-transparent px-7 pt-16 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
            {/* Photo / Video mode toggle */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-black/45 p-1.5 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => {
                    if (recording) stopRecording();
                    setMode("photo");
                  }}
                  aria-label="Photo mode"
                  title="Photo"
                  className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
                    mode === "photo" ? "bg-white text-slate-900 shadow" : "text-white hover:bg-white/20"
                  }`}
                >
                  <Camera size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (recording) stopRecording();
                    setMode("video");
                  }}
                  aria-label="Video mode"
                  title="Video"
                  className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
                    mode === "video" ? "bg-white text-slate-900 shadow" : "text-white hover:bg-white/20"
                  }`}
                >
                  <Clapperboard size={18} />
                </button>
              </div>
              <span className="text-[11px] font-bold tracking-[0.14em] text-white/90">{mode === "photo" ? "PHOTO" : "VIDEO"}</span>
            </div>

            {/* Shutter */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={mode === "photo" ? takePhoto : recording ? stopRecording : startRecording}
                disabled={!ready}
                aria-label={mode === "photo" ? "Take photo" : recording ? "Stop recording" : "Record video"}
                className="flex h-[76px] w-[76px] items-center justify-center rounded-full border-4 border-white/80 bg-white/20 p-1 transition active:scale-90 disabled:opacity-40"
              >
                <span
                  className={`flex h-full w-full items-center justify-center rounded-full ${
                    recording ? "bg-red-500" : "bg-white text-slate-900"
                  }`}
                >
                  {mode === "photo" ? (
                    <Camera size={27} />
                  ) : recording ? (
                    <span className="h-6 w-6 rounded-[5px] bg-white" />
                  ) : (
                    <Video size={28} className="text-slate-900" />
                  )}
                </span>
              </button>
              {ready && <span className="text-[11px] font-medium text-white/80">{recording ? "TAP TO STOP" : "TAP TO CAPTURE"}</span>}
            </div>

            {/* Switch camera — big, right of the shutter */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
                disabled={recording}
                aria-label="Switch camera"
                title="Switch between front and back camera"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition active:scale-95 hover:bg-black/65 disabled:opacity-40"
              >
                <RefreshCcw size={26} />
              </button>
              <span className="rounded-full bg-black/45 px-3 py-0.5 text-[11px] font-bold tracking-wide text-white/90 backdrop-blur-sm">
                {facing === "user" ? "FRONT" : "BACK"}
              </span>
            </div>
          </div>

          {shooting && <div className="absolute inset-0 animate-pulse bg-white/70" />}
        </>
      )}
    </div>,
    document.body
  );
}