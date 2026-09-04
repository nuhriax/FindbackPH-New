"use client";

/**
 * Messenger-style voice-note player: play/pause, tappable progress bar,
 * remaining-time counter and playback-speed cycling (1x → 1.5x → 2x).
 * Renders a static decorative waveform (equalizer bars animate while playing).
 */

import { useEffect, useRef, useState } from "react";
import { Pause, Play, VolumeX } from "lucide-react";

function fmt(s: number) {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

/** Deterministic pseudo-random bar heights so both peers see the same wave. */
function bars(seedStr: string, count = 28): number[] {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) % 100000;
  return Array.from({ length: count }, (_, i) => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return 0.25 + ((seed >> (i % 7)) % 75) / 100;
  });
}

const SPEEDS = [1, 1.5, 2] as const;

export function VoicePlayer({ src, duration, dark }: { src: string; duration?: number | null; dark?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [total, setTotal] = useState(duration ?? 0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const wave = bars(src);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setPos(el.currentTime);
    const onMeta = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) setTotal(el.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setPos(0);
      if (el) el.currentTime = 0;
    };
    // The source failed to load (missing file, bad URL, unsupported codec):
    // surface it in the UI instead of letting play() throw NotSupportedError.
    const onError = () => {
      setPlaying(false);
      setFailed(true);
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("ended", onEnd);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("error", onError);
    };
  }, []);

  const toggle = () => {
    const el = audioRef.current;
    if (!el || failed) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      if (!el.src || el.error) {
        setFailed(true);
        return;
      }
      el.playbackRate = SPEEDS[speedIdx];
      el.play().catch(() => {
        // NotSupportedError / network failure — don't crash the page.
        setPlaying(false);
        setFailed(true);
      });
      setPlaying(true);
    }
  };

  const cycleSpeed = () => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next];
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(total) || total <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    el.currentTime = ratio * total;
    setPos(el.currentTime);
  };

  const progress = total > 0 ? Math.min(1, pos / total) : 0;
  const remaining = Math.max(0, (total || duration || 0) - pos);

  return (
    <div className="flex min-w-[220px] items-center gap-2.5 py-0.5">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} preload="metadata" src={src} className="hidden" />
      <button
        type="button"
        onClick={toggle}
        aria-label={failed ? "Voice note unavailable" : playing ? "Pause voice note" : "Play voice note"}
        title={failed ? "Voice note couldn't be loaded" : undefined}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
          failed
            ? "cursor-not-allowed bg-slate-300 text-slate-500"
            : dark
              ? "bg-white/20 text-white hover:bg-white/30"
              : "msg-gradient text-white hover:opacity-90"
        }`}
      >
        {failed ? <VolumeX size={16} /> : playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>

      {/* Waveform + progress */}
      <div
        onClick={seek}
        role="slider"
        aria-label="Seek voice note"
        aria-valuemin={0}
        aria-valuemax={Math.round(total)}
        aria-valuenow={Math.round(pos)}
        tabIndex={0}
        className="flex h-8 min-w-0 flex-1 cursor-pointer items-center gap-[2px]"
      >
        {wave.map((h, i) => {
          const filled = i / wave.length <= progress;
          return (
            <span
              key={i}
              className={`w-[3px] shrink-0 rounded-full transition-colors ${playing && filled ? "animate-pulse" : ""} ${
                dark ? (filled ? "bg-white" : "bg-white/35") : filled ? "bg-blue-600" : "bg-slate-300"
              }`}
              style={{ height: `${Math.round(h * 100)}%` }}
            />
          );
        })}
      </div>

      <button
        type="button"
        onClick={cycleSpeed}
        aria-label={`Playback speed ${SPEEDS[speedIdx]}x — tap to change`}
        title="Playback speed"
        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums transition ${
          dark ? "bg-white/15 text-white hover:bg-white/25" : "bg-slate-200 text-slate-600 hover:bg-slate-300"
        }`}
      >
        {SPEEDS[speedIdx]}x
      </button>
      <span className={`w-9 shrink-0 text-right text-[11px] font-medium tabular-nums ${dark ? "text-white/80" : "text-slate-500 opacity-80"}`}>
        {fmt(remaining)}
      </span>
    </div>
  );
}
