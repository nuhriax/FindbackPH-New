"use client";

/**
 * WebAudio ring tones — no audio asset files needed.
 *  - incoming: classic double-ring pattern ("brr-brr … brr-brr")
 *  - outgoing: soft ringback beep every 3s
 * Also drives the Vibration API where supported.
 */

let ctx: AudioContext | null = null;
let stopFn: (() => void) | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function beep(at: number, freq: number, dur: number, gainVal = 0.12) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(gainVal, at + 0.03);
  gain.gain.setValueAtTime(gainVal, at + dur - 0.05);
  gain.gain.linearRampToValueAtTime(0, at + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(at);
  osc.stop(at + dur);
}

export function startRingtone(kind: "incoming" | "outgoing") {
  stopRingtone();
  try {
    const c = getCtx();
    // One "phrase" that loops via setInterval.
    const playPhrase = () => {
      const t = c.currentTime + 0.05;
      if (kind === "incoming") {
        // brr-brr: two quick double-beeps
        beep(t, 660, 0.35);
        beep(t + 0.4, 660, 0.35);
      } else {
        // gentle ringback blip
        beep(t, 440, 0.9, 0.06);
      }
    };
    playPhrase();
    const interval = window.setInterval(playPhrase, kind === "incoming" ? 2200 : 3000);

    if (kind === "incoming" && "vibrate" in navigator) {
      const vib = window.setInterval(() => navigator.vibrate?.([300, 150, 300]), 2200);
      navigator.vibrate?.([300, 150, 300]);
      stopFn = () => {
        window.clearInterval(interval);
        window.clearInterval(vib);
      };
    } else {
      stopFn = () => window.clearInterval(interval);
    }
  } catch {
    /* Audio unavailable — silent fallback */
  }
}

export function stopRingtone() {
  if (stopFn) {
    stopFn();
    stopFn = null;
  }
  navigator.vibrate?.(0);
}
