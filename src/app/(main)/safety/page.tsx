"use client";
import Link from "next/link";
import { InPageNav } from "@/components/in-page-nav";
import { SplitText } from "@/components/effects/split-text";
import { Aurora } from "@/components/effects/aurora";
import { MotionReveal } from "@/components/effects/motion-reveal";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CircleDot,
  HeartHandshake,
  Landmark,
  Lock,
  MapPin,
  MessageCircle,
  MoveRight,
  Phone,
  Radar,
  ShieldCheck,
  Sparkles,
  Store,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

/* =========================================================
   DATA
========================================================= */

const protocolSteps = [
  {
    number: "01",
    label: "VERIFY",
    title: "Confirm who you're dealing with",
    description:
      "Before arranging a handoff, make sure the person has a credible connection to the item. Take your time and ask reasonable questions before moving forward.",
    icon: UserCheck,
    status: "READY",
    color: "blue",
  },
  {
    number: "02",
    label: "ASSESS",
    title: "Understand the situation",
    description:
      "Pay attention to urgency, pressure, unusual requests, or changes in behavior. A legitimate recovery should not require you to ignore your instincts.",
    icon: Radar,
    status: "READY",
    color: "amber",
  },
  {
    number: "03",
    label: "PROTECT",
    title: "Keep sensitive information private",
    description:
      "The recovery should stay focused on the item. Passwords, OTPs, banking details, and unnecessary personal information should never be required.",
    icon: Lock,
    status: "ACTIVE",
    color: "emerald",
  },
  {
    number: "04",
    label: "MEET",
    title: "Choose a safer meeting place",
    description:
      "If a handoff is needed, choose a visible, familiar, staffed location with people around and an easy way to leave.",
    icon: MapPin,
    status: "LOCKED",
    color: "blue",
  },
  {
    number: "05",
    label: "RESOLVE",
    title: "Complete the recovery on your terms",
    description:
      "Proceed only when the details make sense and you still feel comfortable. You remain in control of whether and when the recovery happens.",
    icon: CheckCircle2,
    status: "LOCKED",
    color: "emerald",
  },
];

const riskSignals = [
  {
    title: "Meeting environment",
    description:
      "A visible, familiar, staffed location with people nearby.",
    status: "SAFE",
    icon: MapPin,
    color: "emerald",
  },
  {
    title: "Identity confidence",
    description:
      "Ownership should be reasonably established before the handoff.",
    status: "REVIEW",
    icon: UserCheck,
    color: "amber",
  },
  {
    title: "Private information",
    description:
      "Sensitive credentials should never be part of a legitimate recovery.",
    status: "PROTECTED",
    icon: Lock,
    color: "blue",
  },
  {
    title: "Communication behavior",
    description:
      "Unexpected urgency, pressure, or manipulation deserves attention.",
    status: "MONITOR",
    icon: MessageCircle,
    color: "amber",
  },
];

const privacyItems = [
  "Password",
  "OTP / verification code",
  "Banking information",
  "Home address",
  "Unnecessary identification",
];

const meetupPlaces = [
  {
    icon: Building2,
    title: "Shopping malls",
    description:
      "Customer-service areas, security desks, and busy entrances provide visibility, staff, and nearby support.",
    score: "HIGH",
  },
  {
    icon: Store,
    title: "Cafés & restaurants",
    description:
      "Staffed environments with lighting, people, and straightforward exits make handoffs easier to manage.",
    score: "HIGH",
  },
  {
    icon: Landmark,
    title: "Barangay halls",
    description:
      "Recognized public locations can provide additional visibility and accountability during a handoff.",
    score: "HIGH",
  },
  {
    icon: Users,
    title: "Busy public spaces",
    description:
      "Choose places with people around, good visibility, easy access, and a simple way out.",
    score: "GOOD",
  },
];

const redFlags = [
  "They ask for money before returning an item.",
  "They ask for your OTP, verification code, or password.",
  "They request banking information or unnecessary personal details.",
  "They pressure you to meet somewhere private or isolated.",
  "They create urgency and do not give you time to think.",
  "They make you uncomfortable or refuse reasonable questions.",
];

const activityLog = [
  {
    time: "NOW",
    icon: ShieldCheck,
    title: "Recovery guidance initialized",
    description:
      "Safety guidance is ready to help you evaluate the next step.",
    color: "emerald",
  },
  {
    time: "01",
    icon: Lock,
    title: "Privacy protection active",
    description:
      "Sensitive credentials remain outside the recovery process.",
    color: "blue",
  },
  {
    time: "02",
    icon: MapPin,
    title: "Meeting guidance available",
    description:
      "Public and visible meeting environments are recommended.",
    color: "blue",
  },
  {
    time: "03",
    icon: Radar,
    title: "Situation monitoring active",
    description:
      "Potential warning signals are surfaced before you act.",
    color: "amber",
  },
];

/* Real, actionable guidance for scams, payments and reporting.
   Only flows backed by real platform features are referenced:
   listings can be reported via the "Report this listing" button on
   every item page (stored in report_flags and reviewed by moderators).
   There is no in-app "block user" feature yet — so we never pretend
   there is; we advise disengaging and reporting instead. */
const scamTopics = [
  {
    icon: AlertTriangle,
    title: "Common scams",
    description:
      "Watch out for claims that a stranger \"found your item\" but will only return it after you send money, gift cards, or load — or anyone who cannot describe the item accurately.",
    status: "SPOT IT",
    color: "red" as const,
  },
  {
    icon: XCircle,
    title: "Payment requests",
    description:
      "Never send money to receive a found item. A legitimate finder may accept a voluntary reward, but demanding payment first — via GCash, bank transfer, or crypto — is a scam signal.",
    status: "NEVER PAY FIRST",
    color: "red" as const,
  },
  {
    icon: MessageCircle,
    title: "Suspicious requests",
    description:
      "Refuse any request to move the conversation off-platform before you are comfortable, to click unknown links, to scan QR codes, or to verify codes sent to your phone.",
    status: "REFUSE",
    color: "amber" as const,
  },
  {
    icon: Lock,
    title: "Personal information",
    description:
      "Share only what the handover requires. No one legitimately needs your full address in advance, government IDs, OTPs, passwords, or banking details.",
    status: "SHARE LESS",
    color: "blue" as const,
  },
  {
    icon: UserCheck,
    title: "Reporting users & listings",
    description:
      "Every listing has a \"Report this listing\" link. Use it to flag scams, fake reports, harassment, or suspicious behavior — reports go to our moderation team for review.",
    status: "REPORT",
    color: "emerald" as const,
  },
  {
    icon: ShieldCheck,
    title: "Disengage & protect yourself",
    description:
      "There is no need to confront anyone. Stop responding, do not share more information, keep evidence of the conversation, and report the listing so moderators can act on it.",
    status: "STEP AWAY",
    color: "emerald" as const,
  },
];

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function SectionEyebrow({
  number,
  children,
  color = "emerald",
}: {
  number: string;
  children: React.ReactNode;
  color?: "emerald" | "blue" | "amber" | "red";
}) {
  const colors = {
    emerald: "text-emerald-700",
    blue: "text-blue-700",
    amber: "text-amber-700",
    red: "text-red-700",
  };

  return (
    <div className={`flex items-center gap-3 ${colors[color]}`}>
      <span className="h-px w-8 bg-current opacity-40" />

      <span className="text-[9px] font-bold uppercase tracking-[0.24em]">
        {number} / {children}
      </span>
    </div>
  );
}

function StatusDot({
  color = "emerald",
  pulse = false,
}: {
  color?: "emerald" | "blue" | "amber" | "red" | "slate";
  pulse?: boolean;
}) {
  const colors = {
    emerald:
      "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,.35)]",
    blue:
      "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,.3)]",
    amber:
      "bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,.3)]",
    red:
      "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,.3)]",
    slate: "bg-slate-300",
  };

  return (
    <span className="relative flex h-1.5 w-1.5">
      {pulse && (
        <span
          className={`absolute inset-0 rounded-full ${colors[color]} animate-ping opacity-50`}
        />
      )}

      <span
        className={`relative h-1.5 w-1.5 rounded-full ${colors[color]}`}
      />
    </span>
  );
}

function GlassPill({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="group inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/80 px-4 py-2.5 text-xs text-slate-600 shadow-[0_8px_30px_rgba(15,23,42,.05)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_35px_rgba(15,23,42,.08)]">
      <Icon
        size={14}
        className="text-emerald-600 transition-transform duration-300 group-hover:scale-110"
      />
      {children}
    </div>
  );
}

function StatusBadge({
  children,
  color = "emerald",
}: {
  children: React.ReactNode;
  color?: "emerald" | "blue" | "amber" | "red" | "slate";
}) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    red: "bg-red-50 text-red-700 border-red-100",
    slate: "bg-slate-50 text-slate-500 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.16em] ${styles[color]}`}
    >
      <StatusDot color={color} />
      {children}
    </span>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function SafetyPage() {
  return (
    <main className="relative min-h-screen overflow-hidden text-[#2e2417]">

      {/* =====================================================
          GLOBAL ANIMATION + ATMOSPHERE
      ====================================================== */}

      <style jsx global>{`
        @keyframes safety-float {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -12px, 0);
          }
        }

        @keyframes safety-float-slow {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(15px, -10px, 0) scale(1.03);
          }
        }

        @keyframes safety-scan {
          0% {
            transform: translateX(-110%);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateX(110%);
            opacity: 0;
          }
        }

        @keyframes safety-pulse-ring {
          0% {
            transform: scale(0.9);
            opacity: 0.5;
          }
          70% {
            transform: scale(1.2);
            opacity: 0;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }

        @keyframes safety-reveal {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes safety-slide {
          from {
            opacity: 0;
            transform: translateX(-16px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .safety-reveal {
          animation: safety-reveal 0.8s cubic-bezier(0.22, 1, 0.36, 1)
            both;
        }

        .safety-slide {
          animation: safety-slide 0.7s cubic-bezier(0.22, 1, 0.36, 1)
            both;
        }

        .safety-float {
          animation: safety-float 7s ease-in-out infinite;
        }

        .safety-float-slow {
          animation: safety-float-slow 11s ease-in-out infinite;
        }

        .safety-scan {
          animation: safety-scan 5s ease-in-out infinite;
        }

        .safety-delay-1 {
          animation-delay: 0.1s;
        }

        .safety-delay-2 {
          animation-delay: 0.2s;
        }

        .safety-delay-3 {
          animation-delay: 0.3s;
        }

        .safety-delay-4 {
          animation-delay: 0.4s;
        }

        .safety-delay-5 {
          animation-delay: 0.5s;
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        {/* Main ambient glow */}
        <div className="safety-float-slow absolute left-[45%] top-[-18rem] h-[40rem] w-[40rem] rounded-full bg-emerald-300/[0.07] blur-[150px]" />

        <div className="safety-float absolute -left-48 top-[35%] h-[34rem] w-[34rem] rounded-full bg-teal-400/[0.05] blur-[140px]" />

        <div className="safety-float-slow absolute -right-48 top-[68%] h-[36rem] w-[36rem] rounded-full bg-emerald-200/[0.06] blur-[140px]" />

        {/* subtle background grid — uses the warm espresso tone and a soft
            vertical mask so the grid fades out naturally without hard edges */}
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(46,36,23,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(46,36,23,.6) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            maskImage:
              "linear-gradient(to bottom, black, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">

        {/* =====================================================
            SYSTEM HEADER
        ====================================================== */}

        <header className="safety-reveal flex items-center justify-between border-b border-slate-200/70 py-6">

          <div className="flex items-center gap-3">

            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm transition-transform duration-500 hover:rotate-3 hover:scale-105">
              <ShieldCheck size={16} />
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-slate-900">
                FINDBACK
              </p>

              <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                Safety Intelligence
              </p>
            </div>

          </div>

          <div className="flex items-center gap-3 rounded-full border border-emerald-100 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-xl">

            <StatusDot pulse />

            <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-emerald-700">
              Safety guide
            </span>

          </div>

        </header>


        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="relative py-20 sm:py-28 lg:py-32">

          {/* Gentle aurora light drifting behind the hero — mirrors the
              ShaderGradient-style field used across the other pages. */}
          <Aurora opacity={0.26} blur={72} />

          <div className="grid items-center gap-16 lg:grid-cols-[.9fr_1.1fr]">

            {/* COPY */}

            <div className="relative z-10 lg:pl-8">

              <div className="safety-reveal mb-8 flex items-center gap-3">

                <StatusDot pulse />

                <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-emerald-700">
                  Intelligent recovery guidance
                </span>

              </div>

              <h1 className="safety-reveal safety-delay-1 max-w-3xl font-display text-[4rem] font-medium leading-[.88] tracking-[-.075em] sm:text-7xl lg:text-[6.8rem]">

                Recover

                <span className="block text-slate-400">
                  with
                </span>

                <span className="block bg-gradient-to-r from-slate-900 via-blue-700 to-emerald-600 bg-clip-text text-transparent">
                  confidence.
                </span>

              </h1>

              <p className="safety-reveal safety-delay-2 mt-9 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                FindBack helps you make safer decisions during an
                item recovery. It highlights what deserves attention,
                protects sensitive information, and keeps you in
                control of the next step.
              </p>

              <div className="safety-reveal safety-delay-3 mt-9 flex flex-wrap gap-2.5">

                <GlassPill icon={ShieldCheck}>
                  Safety guidance
                </GlassPill>

                <GlassPill icon={UserCheck}>
                  Identity confidence
                </GlassPill>

                <GlassPill icon={Lock}>
                  Privacy protection
                </GlassPill>

              </div>

            </div>


            {/* DASHBOARD */}

            <div className="safety-reveal safety-delay-2 relative">

              <div className="safety-float absolute -inset-12 rounded-[4rem] bg-blue-300/[0.07] blur-[80px]" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/90 bg-white/85 shadow-[0_35px_100px_rgba(15,23,42,.1)] backdrop-blur-2xl transition-transform duration-700 hover:-translate-y-1">

                {/* scan line */}

                <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
                  <div className="safety-scan h-px w-1/3 bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
                </div>

                {/* dashboard header */}

                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

                  <div>

                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      Safety guide
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      Before-handover checklist
                    </p>

                  </div>

                  <StatusBadge color="emerald">
                    Guidance
                  </StatusBadge>

                </div>

                {/* score */}

                <div className="grid gap-8 p-6 sm:grid-cols-[.8fr_1.2fr] sm:p-8">

                  <div className="group flex flex-col justify-center rounded-[1.5rem] bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-8 transition-transform duration-500 hover:scale-[1.015]">

                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      Before any handover
                    </p>

                    <div className="mt-6 space-y-3.5">

                      {[
                        "Verify the person's claim",
                        "Meet in a public place",
                        "Bring someone you trust",
                        "Never share passwords or OTPs",
                      ].map((check) => (

                        <div
                          key={check}
                          className="flex items-start gap-2.5"
                        >

                          <CheckCircle2
                            size={13}
                            className="mt-0.5 shrink-0 text-emerald-600"
                          />

                          <span className="text-xs font-medium leading-5 text-slate-700">
                            {check}
                          </span>

                        </div>

                      ))}

                    </div>

                    <div className="mt-6 flex items-center gap-2 border-t border-slate-200/70 pt-4">

                      <StatusDot pulse />

                      <span className="text-[8px] font-bold uppercase tracking-[.15em] text-emerald-700">
                        Simple habits, safer recovery
                      </span>

                    </div>

                  </div>


                  {/* system checks */}

                  <div className="space-y-2">

                    {[
                      {
                        label: "Identity",
                        value: "Verify first",
                        icon: UserCheck,
                        color: "blue" as const,
                      },
                      {
                        label: "Privacy",
                        value: "Protected",
                        icon: Lock,
                        color: "emerald" as const,
                      },
                      {
                        label: "Location",
                        value: "Public place",
                        icon: MapPin,
                        color: "emerald" as const,
                      },
                      {
                        label: "Situation",
                        value: "Trust your instincts",
                        icon: Radar,
                        color: "amber" as const,
                      },
                    ].map((item, index) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.label}
                          className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-4 transition-all duration-300 hover:-translate-x-1 hover:bg-white hover:shadow-sm"
                          style={{
                            animationDelay: `${index * 100}ms`,
                          }}
                        >

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm transition-transform duration-300 group-hover:scale-105">

                              <Icon
                                size={15}
                                className={
                                  item.color === "emerald"
                                    ? "text-emerald-600"
                                    : item.color === "amber"
                                      ? "text-amber-600"
                                      : "text-blue-600"
                                }
                              />

                            </div>

                            <span className="text-xs font-medium text-slate-600">
                              {item.label}
                            </span>

                          </div>

                          <span className="text-[8px] font-bold uppercase tracking-[.14em] text-slate-400">
                            {item.value}
                          </span>

                        </div>
                      );
                    })}

                  </div>

                </div>


                {/* next action */}

                <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-8">

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                      <p className="text-[8px] font-bold uppercase tracking-[.2em] text-blue-600">
                        Recommended next step
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        Verify ownership before arranging a meeting.
                      </p>

                    </div>

                    <a
                      href="#protocol"
                      className="group inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.15em] text-blue-600 transition-colors hover:text-blue-800"
                    >
                      See the full protocol

                      <ArrowRight
                        size={14}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />

                    </a>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            SYSTEM NAV
        ====================================================== */}

        <section className="sticky top-3 z-30 mb-10">

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/85 p-2 shadow-[0_12px_40px_rgba(15,23,42,.06)] backdrop-blur-xl">

            <div className="flex min-w-max items-center gap-1">

              {[
                ["01", "Overview", "#overview"],
                ["02", "Recovery", "#protocol"],
                ["03", "Situation", "#risk"],
                ["04", "Location", "#location"],
                ["05", "Privacy", "#privacy"],
                ["06", "Scams", "#scams"],
                ["07", "Response", "#response"],
              ].map(([number, label, href]) => (

                <a
                  key={number}
                  href={href}
                  className="group flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50"
                >

                  <span className="font-mono text-[8px] text-slate-300">
                    {number}
                  </span>

                  <span className="text-[9px] font-semibold uppercase tracking-[.13em] text-slate-500 group-hover:text-slate-900">
                    {label}
                  </span>

                </a>

              ))}

              <div className="ml-auto hidden items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 sm:flex">

                <StatusDot pulse />

                <span className="text-[8px] font-bold uppercase tracking-[.15em] text-emerald-700">
                  Guidance
                </span>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            OVERVIEW
        ====================================================== */}

        <section
          id="overview"
          className="scroll-mt-28 border-t border-slate-200/80 py-24 sm:py-32"
        >

          <div className="grid gap-14 lg:grid-cols-[.65fr_1.35fr]">

            <div className="safety-reveal">

              <SectionEyebrow number="01">
                System overview
              </SectionEyebrow>

              <h2 className="mt-7 max-w-xl font-display text-5xl font-medium leading-[.94] tracking-[-.065em] sm:text-6xl">

                Safety isn&apos;t a page.

                <span className="block text-slate-400">
                  It&apos;s a process.
                </span>

              </h2>

            </div>

            <div className="safety-reveal safety-delay-2">

              <p className="max-w-2xl text-base leading-8 text-slate-500">
                Recovering a lost item should not mean rushing into
                a situation you do not understand. FindBack turns
                important moments into clear checks, practical guidance,
                and safer choices—so you can move forward with more
                confidence.
              </p>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">

                {[
                  [
                    "01",
                    "VERIFY",
                    "Build confidence in who you're dealing with.",
                  ],
                  [
                    "02",
                    "ASSESS",
                    "Understand the situation before committing.",
                  ],
                  [
                    "03",
                    "ACT",
                    "Choose the next step without unnecessary pressure.",
                  ],
                ].map(([number, title, description], index) => (

                  <div
                    key={number}
                    className="group rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_50px_rgba(15,23,42,.07)]"
                    style={{
                      animationDelay: `${index * 100}ms`,
                    }}
                  >

                    <span className="font-mono text-[9px] text-slate-300">
                      {number}
                    </span>

                    <h3 className="mt-7 text-sm font-bold tracking-tight text-slate-900">
                      {title}
                    </h3>

                    <p className="mt-2 text-xs leading-6 text-slate-500">
                      {description}
                    </p>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            RECOVERY FLOW
        ====================================================== */}

        <section
          id="protocol"
          className="scroll-mt-28 py-24 sm:py-32"
        >

          <div className="mb-14 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">

            <div>

              <SectionEyebrow number="02" color="blue">
                Recovery flow
              </SectionEyebrow>

              <h2 className="mt-7 max-w-4xl font-display text-5xl font-medium leading-[.92] tracking-[-.065em] sm:text-6xl lg:text-7xl">

                Five decisions.

                <span className="text-blue-600">
                  {" "}One clearer recovery.
                </span>

              </h2>

            </div>

            <p className="max-w-sm text-sm leading-7 text-slate-500">
              Good recovery decisions do not have to be complicated.
              FindBack keeps the important checks visible and helps
              you focus on one meaningful decision at a time.
            </p>

          </div>

          <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_25px_80px_rgba(15,23,42,.05)]">

            {protocolSteps.map((step, index) => {

              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className={`group relative grid gap-7 p-7 transition-all duration-500 hover:bg-slate-50/70 sm:p-9 lg:grid-cols-[90px_280px_1fr_100px] lg:items-center ${
                    index !== protocolSteps.length - 1
                      ? "border-b border-slate-100"
                      : ""
                  }`}
                >

                  <span className="font-mono text-[10px] text-slate-300 transition-colors duration-300 group-hover:text-slate-500">
                    {step.number}
                  </span>

                  <div className="flex items-center gap-4">

                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-2 ${
                        step.color === "emerald"
                          ? "bg-emerald-50"
                          : step.color === "amber"
                            ? "bg-amber-50"
                            : "bg-blue-50"
                      }`}
                    >

                      <Icon
                        size={18}
                        className={
                          step.color === "emerald"
                            ? "text-emerald-600"
                            : step.color === "amber"
                              ? "text-amber-600"
                              : "text-blue-600"
                        }
                      />

                    </div>

                    <div>

                      <p className="text-[8px] font-bold uppercase tracking-[.2em] text-slate-400">
                        {step.label}
                      </p>

                      <h3 className="mt-1 text-base font-semibold text-slate-900">
                        {step.title}
                      </h3>

                    </div>

                  </div>

                  <p className="max-w-xl text-sm leading-7 text-slate-500">
                    {step.description}
                  </p>

                  <div className="lg:text-right">

                    <span
                      className={`text-[8px] font-bold uppercase tracking-[.15em] ${
                        step.status === "ACTIVE"
                          ? "text-emerald-600"
                          : step.status === "READY"
                            ? "text-blue-600"
                            : "text-slate-300"
                      }`}
                    >
                      {step.status}
                    </span>

                  </div>

                </div>
              );
            })}

          </div>

        </section>


        {/* =====================================================
            SITUATION AWARENESS
        ====================================================== */}

        <section
          id="risk"
          className="scroll-mt-28 border-t border-slate-200/80 py-24 sm:py-32"
        >

          <div className="grid gap-14 lg:grid-cols-[.85fr_1.15fr] lg:items-start">

            <div>

              <SectionEyebrow number="03" color="amber">
                Situation awareness
              </SectionEyebrow>

              <h2 className="mt-7 font-display text-5xl font-medium leading-[.94] tracking-[-.065em] sm:text-6xl">

                Understand the

                <span className="block text-amber-600">
                  situation.
                </span>

              </h2>

              <p className="mt-8 max-w-md text-sm leading-7 text-slate-500">
                Not every unusual moment is dangerous, but pressure,
                secrecy, urgency, and unexpected requests deserve
                attention. FindBack helps you pause and evaluate
                before making the next move.
              </p>

              <div className="relative mt-10 overflow-hidden rounded-[1.5rem] border border-amber-100 bg-amber-50/70 p-6">

                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-amber-200/30 blur-3xl" />

                <div className="relative flex items-start gap-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">

                    <Radar
                      size={17}
                      className="text-amber-600"
                    />

                  </div>

                  <div>

                    <p className="text-[8px] font-bold uppercase tracking-[.18em] text-amber-700">
                      Current assessment
                    </p>

                    <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                      Low concern · monitor
                    </p>

                    <p className="mt-2 text-xs leading-6 text-slate-500">
                      No critical warning is currently highlighted.
                      Continue with normal verification and remain
                      comfortable with each step.
                    </p>

                  </div>

                </div>

              </div>

            </div>


            <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-sm">

              {riskSignals.map((signal, index) => {

                const Icon = signal.icon;

                return (
                  <div
                    key={signal.title}
                    className={`group flex items-center gap-5 p-6 transition-all duration-500 hover:bg-slate-50 sm:p-7 ${
                      index !== riskSignals.length - 1
                        ? "border-b border-slate-100"
                        : ""
                    }`}
                  >

                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110 ${
                        signal.color === "emerald"
                          ? "bg-emerald-50"
                          : signal.color === "amber"
                            ? "bg-amber-50"
                            : "bg-blue-50"
                      }`}
                    >

                      <Icon
                        size={18}
                        className={
                          signal.color === "emerald"
                            ? "text-emerald-600"
                            : signal.color === "amber"
                              ? "text-amber-600"
                              : "text-blue-600"
                        }
                      />

                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-3">

                        <h3 className="text-sm font-semibold text-slate-900">
                          {signal.title}
                        </h3>

                        <span
                          className={`text-[8px] font-bold uppercase tracking-[.15em] ${
                            signal.color === "emerald"
                              ? "text-emerald-600"
                              : signal.color === "amber"
                                ? "text-amber-600"
                                : "text-blue-600"
                          }`}
                        >
                          {signal.status}
                        </span>

                      </div>

                      <p className="mt-1 text-xs leading-6 text-slate-500">
                        {signal.description}
                      </p>

                    </div>

                    <ArrowRight
                      size={15}
                      className="text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-slate-500"
                    />

                  </div>
                );
              })}

            </div>

          </div>


          {/* warning signals */}

          <div className="group mt-8 overflow-hidden rounded-[2rem] border border-amber-200 bg-amber-50/70 p-6 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(245,158,11,.08)] sm:p-8">

            <div className="flex flex-col gap-7 lg:flex-row lg:items-start">

              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">

                <span className="absolute inset-0 rounded-xl border border-amber-300/40 opacity-0 transition-opacity duration-300 group-hover:animate-ping group-hover:opacity-100" />

                <AlertTriangle
                  size={18}
                  className="relative text-amber-600"
                />

              </div>

              <div className="flex-1">

                <p className="text-[8px] font-bold uppercase tracking-[.2em] text-amber-700">
                  Warning signals
                </p>

                <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                  Know when the situation changes.
                </h3>

                <div className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">

                  {redFlags.map((item) => (

                    <div
                      key={item}
                      className="flex gap-3 text-sm leading-6 text-slate-600"
                    >

                      <CircleDot
                        size={13}
                        className="mt-1 shrink-0 text-amber-500"
                      />

                      {item}

                    </div>

                  ))}

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            LOCATION INTELLIGENCE
        ====================================================== */}

        <section
          id="location"
          className="scroll-mt-28 py-24 sm:py-32"
        >

          <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr] lg:items-center">

            <div>

              <SectionEyebrow number="04" color="blue">
                Location intelligence
              </SectionEyebrow>

              <h2 className="mt-7 font-display text-5xl font-medium leading-[.94] tracking-[-.065em] sm:text-6xl">

                Where you meet

                <span className="block text-blue-600">
                  matters.
                </span>

              </h2>

              <p className="mt-8 max-w-md text-sm leading-7 text-slate-500">
                A safer meeting place is visible, familiar, staffed,
                accessible, and easy to leave. You should never feel
                trapped into staying somewhere that makes you uncomfortable.
              </p>

              <div className="mt-9 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 transition-all duration-300 hover:bg-emerald-50">

                <HeartHandshake
                  size={18}
                  className="shrink-0 text-emerald-600"
                />

                <p className="text-xs leading-6 text-slate-600">
                  Let someone you trust know where you are going
                  and when you expect to return.
                </p>

              </div>

              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 transition-all duration-300 hover:bg-blue-50">

                <Lock
                  size={18}
                  className="shrink-0 text-blue-600"
                />

                <p className="text-xs leading-6 text-slate-600">
                  Listings only ever show a city and an{" "}
                  <strong className="font-semibold text-slate-700">
                    approximate area
                  </strong>{" "}
                  (for example &ldquo;near SM North EDSA&rdquo;). Never
                  publish your exact address, and never share it in
                  chat until the handover is arranged.
                </p>

              </div>

            </div>


            <div className="grid overflow-hidden rounded-[2rem] border border-slate-200/80 bg-slate-200/60 shadow-sm sm:grid-cols-2">

              {meetupPlaces.map((place, index) => {

                const Icon = place.icon;

                return (
                  <div
                    key={place.title}
                    className="group relative bg-white p-7 transition-all duration-500 hover:z-10 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,.08)] sm:p-8"
                  >

                    <span className="absolute right-7 top-7 font-mono text-[8px] text-slate-300">
                      0{index + 1}
                    </span>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 transition-all duration-500 group-hover:scale-110 group-hover:bg-blue-100">

                      <Icon
                        size={18}
                        className="text-blue-600"
                      />

                    </div>

                    <div className="mt-7 flex items-center justify-between gap-3">

                      <h3 className="text-sm font-semibold text-slate-900">
                        {place.title}
                      </h3>

                      <span className="text-[8px] font-bold uppercase tracking-[.14em] text-emerald-600">
                        {place.score}
                      </span>

                    </div>

                    <p className="mt-3 text-xs leading-6 text-slate-500">
                      {place.description}
                    </p>

                    <div className="mt-7 flex items-center gap-2 text-[8px] font-bold uppercase tracking-[.16em] text-slate-400">

                      <Check
                        size={11}
                        className="text-emerald-500"
                      />

                      Public environment

                    </div>

                  </div>
                );
              })}

            </div>

          </div>

        </section>


        {/* =====================================================
            PRIVACY
        ====================================================== */}

        <section
          id="privacy"
          className="scroll-mt-28 border-t border-slate-200/80 py-24 sm:py-32"
        >

          <div className="grid gap-14 lg:grid-cols-[1fr_.9fr] lg:items-center">

            <div>

              <SectionEyebrow number="05" color="red">
                Privacy protection
              </SectionEyebrow>

              <h2 className="mt-7 max-w-2xl font-display text-5xl font-medium leading-[.94] tracking-[-.065em] sm:text-6xl lg:text-7xl">

                Recovery doesn&apos;t

                <span className="block text-slate-400">
                  require your identity.
                </span>

              </h2>

              <p className="mt-8 max-w-lg text-base leading-8 text-slate-500">
                A legitimate item recovery should stay focused on
                the item. Passwords, financial credentials, security
                codes, and unnecessary private information should
                never become part of the exchange.
              </p>

              <div className="mt-8 flex items-center gap-3 text-xs font-medium text-slate-500">

                <ShieldCheck
                  size={17}
                  className="text-emerald-600"
                />

                When in doubt, share less.

              </div>

            </div>


            <div className="relative">

              <div className="absolute -inset-8 rounded-[3rem] bg-red-100/30 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-red-100 bg-white shadow-[0_30px_90px_rgba(15,23,42,.08)]">

                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

                  <div className="flex items-center gap-3">

                    <StatusDot color="red" pulse />

                    <span className="text-[8px] font-bold uppercase tracking-[.2em] text-slate-400">
                      Outside recovery flow
                    </span>

                  </div>

                  <Lock
                    size={14}
                    className="text-red-400"
                  />

                </div>

                <div className="p-5">

                  {privacyItems.map((item, index) => (

                    <div
                      key={item}
                      className="group flex items-center justify-between border-b border-slate-100 py-5 last:border-0"
                    >

                      <div className="flex items-center gap-4">

                        <span className="font-mono text-[9px] text-slate-300">
                          0{index + 1}
                        </span>

                        <span className="text-sm font-medium text-slate-600 transition-colors group-hover:text-slate-900">
                          {item}
                        </span>

                      </div>

                      <XCircle
                        size={15}
                        className="text-red-400/50 transition-transform duration-300 group-hover:scale-110"
                      />

                    </div>

                  ))}

                </div>

                <div className="border-t border-red-100 bg-red-50/70 px-6 py-5">

                  <div className="flex gap-3">

                    <AlertTriangle
                      size={15}
                      className="mt-0.5 shrink-0 text-red-500"
                    />

                    <p className="text-xs leading-5 text-red-700/70">
                      If someone asks for sensitive credentials,
                      pause the recovery and reconsider the interaction.
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            SCAMS, PAYMENTS & REPORTING
        ====================================================== */}

        <section
          id="scams"
          className="scroll-mt-28 border-t border-slate-200/80 py-24 sm:py-32"
        >

          <div className="grid gap-14 lg:grid-cols-[.7fr_1.3fr]">

            <div className="safety-reveal">

              <SectionEyebrow number="06" color="red">
                Scams &amp; reporting
              </SectionEyebrow>

              <h2 className="mt-7 max-w-xl font-display text-5xl font-medium leading-[.94] tracking-[-.065em] sm:text-6xl">

                If money enters

                <span className="block text-slate-400">
                  the conversation, walk away.
                </span>

              </h2>

              <p className="mt-8 max-w-md text-sm leading-7 text-slate-500">
                Most problems in item recovery come down to a handful
                of patterns. Learn them once and most scams lose their
                power over you.
              </p>

              <div className="mt-8 flex flex-col gap-2.5">

                <Link
                  href="/found"
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_12px_35px_rgba(15,23,42,.06)]"
                >

                  <div className="flex items-center gap-3">

                    <UserCheck size={16} className="text-blue-600" />

                    <span className="text-xs font-medium text-slate-700">
                      Found a suspicious listing?
                    </span>

                  </div>

                  <span className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[.15em] text-blue-600">
                    Browse listings

                    <ArrowRight
                      size={12}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </span>

                </Link>

                <a
                  href="/contact"
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_12px_35px_rgba(15,23,42,.06)]"
                >

                  <div className="flex items-center gap-3">

                    <MessageCircle size={16} className="text-emerald-600" />

                    <span className="text-xs font-medium text-slate-700">
                      Something we should know?
                    </span>

                  </div>

                  <span className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[.15em] text-emerald-600">
                    Contact us

                    <ArrowRight
                      size={12}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </span>

                </a>

              </div>

            </div>


            <div className="grid overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_25px_80px_rgba(15,23,42,.05)] sm:grid-cols-2">

              {scamTopics.map((topic, index) => {

                const Icon = topic.icon;

                return (
                  <div
                    key={topic.title}
                    className={`group relative p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,.08)] sm:p-8 ${
                      index < scamTopics.length - 2
                        ? "border-b border-slate-100"
                        : ""
                    } ${index % 2 === 0 ? "sm:border-r sm:border-slate-100" : ""}`}
                  >

                    <span className="absolute right-7 top-7 font-mono text-[8px] text-slate-300">
                      0{index + 1}
                    </span>

                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-500 group-hover:scale-110 ${
                        topic.color === "red"
                          ? "bg-red-50"
                          : topic.color === "amber"
                            ? "bg-amber-50"
                            : topic.color === "blue"
                              ? "bg-blue-50"
                              : "bg-emerald-50"
                      }`}
                    >

                      <Icon
                        size={18}
                        className={
                          topic.color === "red"
                            ? "text-red-500"
                            : topic.color === "amber"
                              ? "text-amber-600"
                              : topic.color === "blue"
                                ? "text-blue-600"
                                : "text-emerald-600"
                        }
                      />

                    </div>

                    <div className="mt-6 flex items-center justify-between gap-3">

                      <h3 className="text-sm font-semibold text-slate-900">
                        {topic.title}
                      </h3>

                      <span
                        className={`text-[8px] font-bold uppercase tracking-[.14em] ${
                          topic.color === "red"
                            ? "text-red-500"
                            : topic.color === "amber"
                              ? "text-amber-600"
                              : topic.color === "blue"
                                ? "text-blue-600"
                                : "text-emerald-600"
                        }`}
                      >
                        {topic.status}
                      </span>

                    </div>

                    <p className="mt-3 text-xs leading-6 text-slate-500">
                      {topic.description}
                    </p>

                  </div>
                );
              })}

            </div>

          </div>

        </section>


        {/* =====================================================
            RECOVERY ACTIVITY
        ====================================================== */}

        <section className="py-24 sm:py-32">

          <div className="grid gap-14 lg:grid-cols-[.75fr_1.25fr]">

            <div>

              <SectionEyebrow number="07" color="emerald">
                Recovery activity — example
              </SectionEyebrow>

              <h2 className="mt-7 font-display text-5xl font-medium leading-[.94] tracking-[-.065em] sm:text-6xl">

                Your recovery,

                <span className="block text-emerald-600">
                  clearly tracked.
                </span>

              </h2>

              <p className="mt-8 max-w-md text-sm leading-7 text-slate-500">
                The timeline below is an illustrative example of what a
                well-run recovery looks like — it is not live data.
                Important recovery signals should be easy to understand,
                so you can make decisions without losing track of what
                matters.
              </p>

            </div>


            <div className="relative">

              <div className="absolute left-5 top-5 bottom-5 w-px bg-slate-200" />

              <div className="space-y-3">

                {activityLog.map((event, index) => {

                  const Icon = event.icon;

                  return (
                    <div
                      key={event.title}
                      className="group relative flex gap-5 rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_45px_rgba(15,23,42,.07)]"
                      style={{
                        animationDelay: `${index * 100}ms`,
                      }}
                    >

                      <div
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110 ${
                          event.color === "emerald"
                            ? "bg-emerald-50"
                            : event.color === "amber"
                              ? "bg-amber-50"
                              : "bg-blue-50"
                        }`}
                      >

                        <Icon
                          size={16}
                          className={
                            event.color === "emerald"
                              ? "text-emerald-600"
                              : event.color === "amber"
                                ? "text-amber-600"
                                : "text-blue-600"
                          }
                        />

                      </div>

                      <div className="flex-1">

                        <div className="flex items-center justify-between gap-3">

                          <h3 className="text-sm font-semibold text-slate-900">
                            {event.title}
                          </h3>

                          <span className="font-mono text-[8px] text-slate-300">
                            {event.time}
                          </span>

                        </div>

                        <p className="mt-1 text-xs leading-6 text-slate-500">
                          {event.description}
                        </p>

                      </div>

                    </div>
                  );
                })}

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            RESPONSE CENTER
        ====================================================== */}

        <section
          id="response"
          className="scroll-mt-28 py-20 sm:py-28"
        >

          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white shadow-[0_35px_100px_rgba(15,23,42,.08)]">

            {/* ambient glow */}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-red-200/20 blur-[100px]"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-emerald-200/20 blur-[110px]"
            />

            {/* subtle grid */}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage:
                  "linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)",
                backgroundSize: "42px 42px",
              }}
            />

            <div className="relative">

              {/* =================================================
                  RESPONSE HEADER
              ================================================= */}

              <div className="border-b border-slate-200/80 px-6 py-7 sm:px-10 sm:py-9 lg:px-12">

                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                  <div className="flex items-start gap-5">

                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-red-100 bg-red-50">

                      <span className="absolute inset-0 animate-ping rounded-2xl bg-red-400/10" />

                      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                        <AlertTriangle
                          size={17}
                          strokeWidth={1.8}
                          className="text-red-500"
                        />
                      </div>

                    </div>

                    <div>

                      <div className="flex items-center gap-2">

                        <StatusDot color="red" pulse />

                        <span className="text-[8px] font-bold uppercase tracking-[0.24em] text-red-600">
                          Response guidance
                        </span>

                      </div>

                      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-900 sm:text-3xl">
                        Something doesn&apos;t feel right?
                      </h2>

                      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                        You do not need to continue a recovery
                        conversation that makes you uncomfortable.
                        Pause, protect your information, and decide
                        what happens next on your terms.
                      </p>

                    </div>

                  </div>

                  <button
                    type="button"
                    className="group inline-flex w-fit items-center gap-3 rounded-full border border-red-200 bg-red-50/70 px-5 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-red-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-50 hover:shadow-[0_10px_30px_rgba(239,68,68,.1)]"
                  >
                    Report activity

                    <ArrowRight
                      size={14}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </button>

                </div>

              </div>


              {/* =================================================
                  MAIN RESPONSE GRID
              ================================================= */}

              <div className="grid lg:grid-cols-[0.85fr_1.15fr]">


                {/* =================================================
                    SAFETY PRINCIPLE
                ================================================= */}

                <div className="border-b border-slate-200/80 bg-slate-50/60 p-7 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/70">

                      <ShieldCheck
                        size={17}
                        className="text-emerald-600"
                      />

                    </div>

                    <div>

                      <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                        Safety principle
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Your safety comes before the item.
                      </p>

                    </div>

                  </div>

                  <h3 className="mt-10 max-w-md font-display text-4xl font-medium leading-[0.95] tracking-[-0.065em] text-slate-900 sm:text-5xl">

                    You are allowed to

                    <span className="block text-emerald-600">
                      stop.
                    </span>

                  </h3>

                  <p className="mt-6 max-w-md text-sm leading-7 text-slate-500">
                    You can pause the conversation, decline a meeting,
                    leave a location, or ask someone you trust to help.
                    Recovering an item is never worth putting yourself
                    at unnecessary risk.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-2">

                    {[
                      "Pause",
                      "Step away",
                      "Ask for help",
                    ].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:text-slate-900"
                      >
                        {item}
                      </span>
                    ))}

                  </div>

                </div>


                {/* =================================================
                    IMMEDIATE DANGER
                ================================================= */}

                <div className="p-7 sm:p-10 lg:p-12">

                  <div className="flex flex-col gap-7">

                    <div className="flex items-start justify-between gap-5">

                      <div>

                        <div className="flex items-center gap-2">

                          <StatusDot color="red" pulse />

                          <span className="text-[8px] font-bold uppercase tracking-[0.22em] text-red-600">
                            Immediate danger
                          </span>

                        </div>

                        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-slate-900">
                          Get somewhere safer first.
                        </h3>

                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                          If you feel threatened or believe you may be
                          in immediate danger, leave if you can do so
                          safely and contact emergency services.
                          FindBack is not a replacement for emergency
                          responders.
                        </p>

                      </div>

                      <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 sm:flex">

                        <Phone
                          size={17}
                          className="text-slate-600"
                        />

                      </div>

                    </div>


                    {/* PRIMARY EMERGENCY ACTION */}

                    <a
                      href="tel:911"
                      className="group relative overflow-hidden rounded-[1.5rem] border border-red-200 bg-gradient-to-br from-red-50 via-white to-white p-5 transition-all duration-500 hover:-translate-y-1 hover:border-red-300 hover:shadow-[0_20px_50px_rgba(239,68,68,.12)]"
                    >

                      <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-red-100/40 blur-3xl transition-transform duration-700 group-hover:scale-150" />

                      <div className="relative flex items-center justify-between gap-5">

                        <div className="flex items-center gap-4">

                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-white shadow-[0_8px_25px_rgba(239,68,68,.25)] transition-transform duration-300 group-hover:scale-105">

                            <Phone
                              size={18}
                              strokeWidth={2}
                            />

                          </div>

                          <div>

                            <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-red-500">
                              Nationwide emergency hotline
                            </p>

                            <p className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-slate-900">
                              911
                            </p>

                          </div>

                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-white text-red-500 transition-transform duration-300 group-hover:translate-x-1">

                          <ArrowRight size={15} />

                        </div>

                      </div>

                      <p className="relative mt-4 border-t border-red-100 pt-4 text-xs leading-5 text-slate-500">
                        Use the appropriate emergency service when
                        there is an immediate threat to your safety.
                      </p>

                    </a>


                    {/* ADDITIONAL SUPPORT */}

                    <div>

                      <div className="mb-3 flex items-center justify-between">

                        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400">
                          Additional support
                        </p>

                        <span className="text-[8px] font-medium text-slate-400">
                          Philippines
                        </span>

                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">

                        {[
                          {
                            label: "Philippine Red Cross",
                            number: "143",
                            icon: HeartHandshake,
                            description: "Emergency assistance",
                          },
                          {
                            label: "Trusted person",
                            number: "CALL",
                            icon: Users,
                            description:
                              "Someone you know and trust",
                          },
                        ].map((item) => {

                          const Icon = item.icon;

                          return (
                            <button
                              type="button"
                              key={item.label}
                              className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_12px_35px_rgba(15,23,42,.06)]"
                            >

                              <div className="flex items-center gap-3">

                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-colors group-hover:bg-white">

                                  <Icon size={15} />

                                </div>

                                <div>

                                  <p className="text-[9px] font-semibold text-slate-700">
                                    {item.label}
                                  </p>

                                  <p className="mt-0.5 text-[8px] text-slate-400">
                                    {item.description}
                                  </p>

                                </div>

                              </div>

                              <span className="font-mono text-xs font-bold text-slate-900">
                                {item.number}
                              </span>

                            </button>
                          );
                        })}

                      </div>

                    </div>


                    {/* SAFETY CHECKLIST */}

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 transition-all duration-300 hover:bg-emerald-50">

                      <div className="flex items-start gap-3">

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">

                          <CheckCircle2
                            size={15}
                            className="text-emerald-600"
                          />

                        </div>

                        <div>

                          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-700">
                            Before you continue
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Move to a visible place, keep your phone
                            with you, and let someone you trust know
                            where you are.
                          </p>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              </div>


              {/* =================================================
                  TRUST BAR
              ================================================= */}

              <div className="border-t border-slate-200/80 bg-slate-50/50 px-6 py-5 sm:px-10 lg:px-12">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-center gap-2">

                    <Lock
                      size={13}
                      className="text-slate-400"
                    />

                    <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Never share passwords, OTPs, banking details,
                      or unnecessary personal information.
                    </span>

                  </div>

                  <span className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.16em] text-emerald-600">

                    <StatusDot pulse />

                    Safety guidance

                  </span>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            FINAL SYSTEM PRINCIPLE
        ====================================================== */}

        <section className="relative overflow-hidden py-36 text-center sm:py-48">

          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300/[0.08] blur-[130px]" />

          <div className="safety-float-slow pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200/60" />

          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/60" />

          <div className="relative mx-auto max-w-5xl">

            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 shadow-[0_0_70px_rgba(31,196,136,.07)]">

              <span className="absolute inset-0 rounded-full border border-emerald-300/40 animate-ping" />

              <HeartHandshake
                size={31}
                strokeWidth={1.2}
                className="relative text-emerald-600"
              />

            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-[.3em] text-emerald-700">

              <Sparkles size={13} />

              FindBack Safety Intelligence

            </div>

            <h2 className="mt-8 font-display text-5xl font-medium leading-[.9] tracking-[-.07em] sm:text-6xl lg:text-[6.8rem]">

              The item can wait.

              <span className="block text-emerald-600">
                Your safety can&apos;t.
              </span>

            </h2>

            <p className="mx-auto mt-9 max-w-xl text-base leading-8 text-slate-500">
              If something does not feel right, you do not owe anyone
              a meetup, an explanation, or your personal information.
              You are allowed to pause, step away, and choose a safer
              path.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-2.5">

              <GlassPill icon={ShieldCheck}>
                Protect yourself
              </GlassPill>

              <GlassPill icon={Users}>
                Look out for others
              </GlassPill>

            </div>

            <div className="mt-12 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-[.25em] text-slate-400">

              <ShieldCheck
                size={14}
                className="text-emerald-500"
              />

              Better decisions. Safer recoveries.

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}