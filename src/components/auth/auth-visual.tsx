"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Check,
  KeyRound,
  MapPin,
  Package,
  Radar,
  Search,
  Smartphone,
  Sparkles,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register";

/* ------------------------------- Journey -------------------------------- */
type PhaseKey = "lost" | "searching" | "reported" | "match" | "matched" | "found";

const PHASES: { key: PhaseKey; ms: number; progress: number }[] = [
  { key: "lost", ms: 2500, progress: 0 },
  { key: "searching", ms: 2300, progress: 0.18 },
  { key: "reported", ms: 2300, progress: 0.4 },
  { key: "match", ms: 2200, progress: 0.6 },
  { key: "matched", ms: 2100, progress: 0.82 },
  { key: "found", ms: 3000, progress: 1 },
];

const STEPS_ALL = [
  { key: "lost", label: "Lost", icon: Search },
  { key: "searching", label: "Searching", icon: Radar },
  { key: "reported", label: "Reported", icon: BellRing },
  { key: "match", label: "Match", icon: Sparkles },
  { key: "matched", label: "Matched", icon: Package },
  { key: "found", label: "Found ✓", icon: Check },
];
/* Compact set for small screens (clearest anchors, less clutter). */
const STEPS_MOBILE = [
  { key: "lost", label: "Lost", icon: Search },
  { key: "reported", label: "Reported", icon: BellRing },
  { key: "matched", label: "Matched", icon: Package },
  { key: "found", label: "Found ✓", icon: Check },
];

const NETWORK: Record<PhaseKey, { text: string; dot: string }> = {
  lost: { text: "Searching for lost items...", dot: "" },
  searching: { text: "Searching nearby...", dot: "warn" },
  reported: { text: "Reported · reviewing reports", dot: "" },
  match: { text: "Possible match detected", dot: "warn" },
  matched: { text: "Matching reports...", dot: "" },
  found: { text: "Item successfully matched", dot: "ok" },
};

const LOCATIONS = [
  { name: "Quezon City", cls: "av-loc-1" },
  { name: "Bulacan", cls: "av-loc-2" },
  { name: "Cebu", cls: "av-loc-3" },
  { name: "Davao", cls: "av-loc-4" },
];

const PARTICLES = [
  { left: "12%", size: 3, duration: 16, delay: 0 },
  { left: "28%", size: 2, duration: 19, delay: -6 },
  { left: "44%", size: 2, duration: 14, delay: -2 },
  { left: "58%", size: 3, duration: 21, delay: -11 },
  { left: "72%", size: 2, duration: 17, delay: -8 },
  { left: "86%", size: 3, duration: 15, delay: -4 },
];

const CARDS = [
  { key: "phone", icon: Smartphone, title: "Phone", cls: "av-card-1" },
  { key: "wallet", icon: Wallet, title: "Wallet", cls: "av-card-2" },
  { key: "keys", icon: KeyRound, title: "Keys", cls: "av-card-3" },
] as const;

type CardStatus = { text: string; tone: string; cls: string };

function cardStatus(key: string, phase: PhaseKey): CardStatus {
  switch (key) {
    case "phone":
      if (phase === "searching") return { text: "Searching...", tone: "warn", cls: "is-active" };
      if (phase === "found") return { text: "Found ✓", tone: "ok", cls: "is-found" };
      if (phase === "lost") return { text: "Lost", tone: "lost", cls: "is-active" };
      return { text: "Lost", tone: "muted", cls: "" };
    case "wallet":
      if (phase === "match") return { text: "Possible Match", tone: "warn", cls: "is-active" };
      if (phase === "matched") return { text: "Match Found", tone: "accent", cls: "is-active" };
      if (phase === "found") return { text: "Reunited", tone: "ok", cls: "" };
      return { text: "Candidate", tone: "muted", cls: "" };
    case "keys":
      if (phase === "found") return { text: "Found ✓", tone: "ok", cls: "is-found" };
      if (phase === "matched") return { text: "Matched", tone: "accent", cls: "is-active" };
      if (phase === "reported") return { text: "Scanning", tone: "warn", cls: "" };
      return { text: "Searching", tone: "muted", cls: "" };
    default:
      return { text: "", tone: "muted", cls: "" };
  }
}

/**
 * Continuously moving "lost item journey" panel — a coordinated state machine
 * that cycles the Lost → Reported → Matched → Found narrative, drives the
 * items' live statuses, the network indicator, the timeline progress and the
 * "Item Found" celebration. Continuous atmosphere (blobs, particles, pins)
 * runs in parallel CSS. Respects reduced motion (freezes at the completed
 * state and stops the cycle), and keeps decorative elements light on mobile.
 */
export function AuthVisual({ className }: { mode: AuthMode; className?: string }) {
  const [reduced, setReduced] = useState(false);
  const [desktop, setDesktop] = useState(true);
  const [phase, setPhase] = useState(0);

  // reduced-motion (JS gate for the loops/timers)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // breakpoint for the timeline density
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setDesktop(mq.matches);
    const onChange = () => setDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // the journey cycle — hold "Found" briefly, then smoothly restart
  useEffect(() => {
    if (reduced) {
      setPhase(PHASES.length - 1); // settle on a completed, static state
      return;
    }
    const timer = window.setTimeout(
      () => setPhase((p) => (p + 1) % PHASES.length),
      PHASES[phase].ms
    );
    return () => window.clearTimeout(timer);
  }, [phase, reduced]);

  const phaseKey = PHASES[phase].key;
  const isFound = phaseKey === "found";
  const steps = desktop ? STEPS_ALL : STEPS_MOBILE;
  const net = NETWORK[phaseKey];
  const progress = useMemo(() => PHASES[phase].progress, [phase]);

  return (
    <div className={cn("auth-visual", className)} aria-hidden="true">
      <div className="av-bg-cell" />
      <div className="av-grid" />

      <span className="av-blob av-blob-1" />
      <span className="av-blob av-blob-2" />
      <span className="av-blob av-blob-3" />

      {/* interactive floating item cards */}
      {CARDS.map((card) => {
        const s = cardStatus(card.key, phaseKey);
        const Icon = card.icon;
        return (
          <div key={card.key} className={cn("av-card", card.cls, s.cls)}>
            <Icon size={16} strokeWidth={2} />
            <div className="av-card-body">
              <span className="av-card-title">{card.title}</span>
              <span className={cn("av-pill", `tone-${s.tone}`)}>{s.text}</span>
            </div>
          </div>
        );
      })}

      {/* map pins */}
      <div className="av-pin av-pin-1">
        <MapPin size={20} strokeWidth={2} />
        <span className="av-pin-ring" />
      </div>
      <div className="av-pin av-pin-2">
        <MapPin size={20} strokeWidth={2} />
        <span className="av-pin-ring" />
      </div>

      {/* rising particles */}
      {!reduced &&
        PARTICLES.map((p, i) => (
          <span
            key={i}
            className="av-particle"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              animation: `av-rise ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}

      {/* Philippine location nodes */}
      {!reduced &&
        LOCATIONS.map((loc) => (
          <div key={loc.name} className={cn("av-loc", loc.cls)}>
            <span className="av-loc-dot" />
            <span className="av-loc-name">{loc.name}</span>
          </div>
        ))}

      {/* brand caption (desktop) */}
      <div className="av-brand">
        <h2>Bring what&apos;s lost back home.</h2>
        <p>Report, match and reunite — delivered safely and locally across the Philippines.</p>
      </div>

      {/* animated connection lines */}
      {!reduced && (
        <svg className="av-lines" viewBox="0 0 400 400" preserveAspectRatio="none">
          <polyline className="av-line" points="40,120 200,240 360,150" fill="none" strokeWidth="1.5" />
          <polyline className="av-line av-line-2" points="80,320 220,220 340,300" fill="none" strokeWidth="1.5" />
        </svg>
      )}

      {/* live network status */}
      <div className="av-network">
        <span className={cn("av-ndot", net.dot)} />
        <span className="av-nlabel">
          <span className="av-ntitle">FindBack PH Network</span>
          <span className="av-nstatus">{net.text}</span>
        </span>
      </div>

      {/* ambient periodic notifications */}
      {!reduced && (
        <>
          <div className="av-toast av-toast-1">
            <span className="av-toast-ic">
              <Check size={12} strokeWidth={3} />
            </span>
            Report matched · Bulacan
          </div>
          <div className="av-toast av-toast-2">
            <span className="av-toast-ic">
              <Check size={12} strokeWidth={3} />
            </span>
            Resolved · Quezon City
          </div>
        </>
      )}

      {/* "Item Found" celebration on reaching Found */}
      {isFound && (
        <div className="av-big-toast">
          <span className="av-toast-ic">
            <Check size={13} strokeWidth={3} />
          </span>
          Item Found · Reunited with owner
        </div>
      )}

      {/* Lost → Reported → Matched → Found timeline */}
      <div className="av-timeline-wrap">
        <div className="av-timeline">
          <span className="av-track" />
          <span className="av-fill" style={{ transform: `scaleX(${progress})` }} />
          <div className="av-steps">
            {steps.map((step) => {
              const Icon = step.icon;
              const idx = STEPS_ALL.findIndex((s) => s.key === step.key);
              const state =
                idx < phase ? "done" : idx === phase ? (isFound ? "found" : "live") : "pending";
              return (
                <div key={step.key} className={cn("av-step", `is-${state}`)}>
                  <span className="av-step-dot">
                    <Icon size={13} strokeWidth={2.5} />
                  </span>
                  <span className="av-step-label">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}