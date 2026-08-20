import Link from "next/link";
import { InPageNav } from "@/components/in-page-nav";
import { SplitText } from "@/components/effects/split-text";
import { Aurora } from "@/components/effects/aurora";
import { MotionReveal } from "@/components/effects/motion-reveal";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AnimatedNumber } from "@/components/home/animated-number";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Fingerprint,
  Globe2,
  HandHeart,
  HeartHandshake,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

// =============================================================
// TYPES
// =============================================================

interface Benefit {
  icon: LucideIcon;
  number: string;
  title: string;
  text: string;
}

interface Step {
  icon: LucideIcon;
  number: string;
  title: string;
  description: string;
}

interface Value {
  icon: LucideIcon;
  number: string;
  title: string;
  description: string;
}

interface NetworkNode {
  x: string;
  y: string;
  label: string;
}

// =============================================================
// DATA
// =============================================================

const benefits: Benefit[] = [
  {
    icon: Search,
    number: "01",
    title: "Find what matters",
    text: "Search reports from people who have lost or found belongings within their communities.",
  },
  {
    icon: ShieldCheck,
    number: "02",
    title: "Connect with care",
    text: "Communicate with others through a more thoughtful and privacy-conscious experience.",
  },
  {
    icon: HeartHandshake,
    number: "03",
    title: "Bring it home",
    text: "Turn a simple discovery into a safe and meaningful return to its rightful owner.",
  },
];

const steps: Step[] = [
  {
    number: "01",
    icon: Search,
    title: "Search",
    description:
      "Browse existing lost and found reports to see whether something matches what you're looking for.",
  },
  {
    number: "02",
    icon: MessageCircle,
    title: "Connect",
    description:
      "Found a possible match? Start a conversation and communicate without unnecessarily exposing private details.",
  },
  {
    number: "03",
    icon: HeartHandshake,
    title: "Reconnect",
    description:
      "Verify the item together and arrange a safe, practical way to return it to its rightful owner.",
  },
];

const values: Value[] = [
  {
    icon: Users,
    number: "01",
    title: "Community powered",
    description:
      "Every report creates another opportunity for someone to recover something important.",
  },
  {
    icon: LockKeyhole,
    number: "02",
    title: "Privacy conscious",
    description:
      "Helping someone should not require sharing more personal information than necessary.",
  },
  {
    icon: HeartHandshake,
    number: "03",
    title: "Built on kindness",
    description:
      "A small act of returning something can make a surprisingly meaningful difference.",
  },
];

const storyChecklist = [
  "Make reports easier to discover",
  "Encourage responsible communication",
  "Reduce unnecessary friction",
  "Help communities reconnect",
];

const missionValues = [
  "Community",
  "Trust",
  "Safety",
  "Kindness",
];

const networkNodes: NetworkNode[] = [
  {
    x: "left-[13%]",
    y: "top-[28%]",
    label: "LUZON",
  },
  {
    x: "left-[43%]",
    y: "top-[43%]",
    label: "METRO MANILA",
  },
  {
    x: "right-[15%]",
    y: "top-[28%]",
    label: "COMMUNITY",
  },
  {
    x: "left-[30%]",
    y: "bottom-[22%]",
    label: "VISAYAS",
  },
  {
    x: "right-[20%]",
    y: "bottom-[20%]",
    label: "MINDANAO",
  },
];

// =============================================================
// SHARED COMPONENTS
// =============================================================

function Eyebrow({
  children,
  number,
}: {
  children: ReactNode;
  number?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="h-px w-7 bg-blue-500 sm:w-9"
      />

      <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-blue-600">
        {children}
      </span>

      {number && (
        <span className="font-mono text-[9px] tracking-[0.15em] text-slate-400">
          / {number}
        </span>
      )}
    </div>
  );
}

function ButtonLink({
  href,
  children,
  variant = "primary",
  icon: Icon = ArrowRight,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  icon?: LucideIcon;
}) {
  const styles =
    variant === "primary"
      ? [
          "bg-navy-900 text-white",
          "shadow-[0_15px_40px_rgba(15,23,42,0.12)]",
          "hover:-translate-y-0.5",
          "hover:bg-slate-800",
          "hover:shadow-[0_20px_50px_rgba(15,23,42,0.18)]",
        ].join(" ")
      : [
          "border border-slate-200 bg-white text-navy-900",
          "hover:-translate-y-0.5",
          "hover:border-blue-300",
          "hover:bg-blue-50/50",
        ].join(" ");

  return (
    <Link
      href={href}
      className={[
        "group inline-flex items-center justify-center gap-3 rounded-full",
        "px-6 py-3.5 text-sm font-semibold",
        "transition-all duration-300",
        "focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:ring-offset-2",
        styles,
      ].join(" ")}
    >
      {children}

      <Icon
        aria-hidden="true"
        size={16}
        strokeWidth={1.8}
        className="transition-transform duration-300 group-hover:translate-x-1"
      />
    </Link>
  );
}

// =============================================================
// PAGE
// =============================================================

export const metadata = {
  title: "About — FindBack PH",
  description:
    "FindBack PH helps Philippine communities reconnect people with the things they lost — through smart matching, private messaging, and safe returns.",
};

export default async function AboutPage() {
  const supabase = createClient();

  const [
    { count: lostCount },
    { count: foundCount },
    { count: recoveredCount },
  ] = await Promise.all([
    supabase
      .from("lost_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("found_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("lost_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "recovered"),
  ]);

  return (
    <main className="relative min-h-screen overflow-hidden text-navy-900 selection:bg-blue-100 selection:text-blue-950">
      {/* The global BackgroundEffects (mounted in the root layout) provides the
          single site-wide blue/cyan + lavender/violet background behind this page. */}

      {/* =========================================================
          HERO
      ========================================================= */}

            <section className="relative px-5 pb-28 pt-24 sm:px-6 lg:pb-36 lg:pt-32">
        {/* Subtle aurora light drifting behind the hero copy — mirrors the
            ShaderGradient-style field on the home / safety / contact pages. */}
        <Aurora opacity={0.32} blur={74} />
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-20 lg:grid-cols-[1.05fr_.95fr]">

            {/* LEFT */}
            <div>
              <Eyebrow number="001">
                About FindBack PH
              </Eyebrow>

                            <h1 className="mt-8 max-w-5xl text-[3.5rem] font-semibold leading-[0.94] tracking-[-0.06em] text-navy-900 sm:text-6xl lg:text-[6.1rem]">
                <MotionReveal delay={60}>
                  <SplitText
                  segments={[
                    { text: "Lost things " },
                    { text: "have stories.", className: "text-slate-300", break: true },
                    {
                      text: "Help them continue.",
                      className:
                        "bg-gradient-to-r from-blue-600 via-blue-500 to-electric-500 bg-clip-text text-transparent",
                      single: true,
                      break: true,
                    },
                  ]}
                                />
                </MotionReveal>
              </h1>

              <p className="mt-9 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg sm:leading-8">
                FindBack PH helps people across the Philippines reconnect
                with belongings that matter — through a simpler, safer,
                community-powered way to find what was lost.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/search">
                  Find an Item
                </ButtonLink>

                <ButtonLink
                  href="/report/lost"
                  variant="secondary"
                  icon={Plus}
                >
                  Report Something Lost
                </ButtonLink>
              </div>

              <div className="mt-10 flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/50" />
                  <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
                </span>

                <span className="text-xs font-medium tracking-wide text-slate-500">
                  Helping communities reconnect across the Philippines
                </span>
              </div>
            </div>

            {/* RIGHT VISUAL */}
            <div
              aria-hidden="true"
              className="relative hidden min-h-[500px] lg:block"
            >
              <div className="absolute right-0 top-0 text-right font-mono text-[9px] leading-6 tracking-[0.2em] text-slate-400">
                FIND
                <br />
                CONNECT
                <br />
                RETURN
              </div>

              {/* Outer rings */}
              <div className="absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/80" />

              <div className="absolute left-1/2 top-1/2 h-[335px] w-[335px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-200/70" />

              <div className="absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-200/80" />

              {/* Rotating beam */}
              <div className="absolute left-1/2 top-1/2 h-[225px] w-px origin-bottom -translate-x-1/2 -translate-y-full bg-gradient-to-t from-blue-500/60 to-transparent motion-safe:animate-[spin_10s_linear_infinite]" />

              {/* Center glow */}
              <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/20 blur-3xl" />

              {/* Center */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="flex h-28 w-28 items-center justify-center rounded-full border border-blue-200 bg-white shadow-[0_20px_80px_rgba(37,119,231,.15)]">
                  <HeartHandshake
                    size={38}
                    strokeWidth={1.4}
                    className="text-blue-500"
                  />
                </div>
              </div>

              {/* Connection lines */}
              <div className="absolute left-[13%] top-[35%] h-px w-[34%] rotate-[13deg] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />

              <div className="absolute right-[13%] top-[33%] h-px w-[31%] -rotate-[20deg] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />

              <div className="absolute bottom-[27%] left-[22%] h-px w-[53%] rotate-[24deg] bg-gradient-to-r from-transparent via-blue-400/25 to-transparent" />

              {/* Lost */}
              <div className="absolute left-[7%] top-[29%]">
                <div className="flex items-center gap-3">
                  <span className="relative h-2 w-2">
                    <span className="absolute inset-0 animate-ping rounded-full bg-blue-400/40" />
                    <span className="relative block h-2 w-2 rounded-full bg-blue-400" />
                  </span>

                  <span className="text-[9px] font-semibold tracking-[0.18em] text-slate-500">
                    LOST REPORT
                  </span>
                </div>
              </div>

              {/* Match */}
              <div className="absolute right-[6%] top-[23%]">
                <div className="flex items-center gap-3">
                  <span className="relative h-2 w-2">
                    <span className="absolute inset-0 animate-ping rounded-full bg-blue-400/40" />
                    <span className="relative block h-2 w-2 rounded-full bg-blue-400" />
                  </span>

                  <span className="text-[9px] font-semibold tracking-[0.18em] text-slate-500">
                    POSSIBLE MATCH
                  </span>
                </div>
              </div>

              {/* Return */}
              <div className="absolute bottom-[18%] right-[8%]">
                <div className="flex items-center gap-3">
                  <span className="relative h-2 w-2">
                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40" />
                    <span className="relative block h-2 w-2 rounded-full bg-emerald-500" />
                  </span>

                  <span className="text-[9px] font-semibold tracking-[0.18em] text-slate-500">
                    RETURN
                  </span>
                </div>
              </div>

              {/* Bottom description */}
              <div className="absolute bottom-0 left-0 max-w-[250px] border-l border-blue-200 pl-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-blue-500">
                  Built around people
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  One connection can be enough to bring something important
                  home.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          ON THIS PAGE — sticky in-page index
      ========================================================= */}

            {/* =========================================================
          FACTS
      ========================================================= */}
      <section
        id="facts"
        className="scroll-mt-28 border-y border-slate-200 bg-white/70 px-5 py-16 sm:px-6 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-500">
                The facts
              </span>
              <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-[.96] tracking-[-0.04em] text-navy-900 sm:text-5xl">
                Numbers that belong to the community.
              </h2>
                            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600">
                These aren&apos;t sample figures — they&apos;re live counts from FindBack
                PH reports, updated alongside the rest of the site.
              </p>
            </div>
          </div>

          <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-2 lg:gap-16">
            {/* Live counts */}
            <div className="overflow-hidden rounded-[1.375rem] border border-slate-200 bg-white/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.04)] backdrop-blur-xl sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Community impact — live
              </p>

              <div className="mt-6 grid grid-cols-3 divide-x divide-slate-200">
                {[
                  { value: lostCount ?? 0, label: "Active lost" },
                  { value: foundCount ?? 0, label: "Active found" },
                  { value: recoveredCount ?? 0, label: "Reunited", accent: true },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="px-3 text-center first:pl-0 last:pr-0"
                  >
                    <div
                      className={`text-3xl font-semibold sm:text-4xl ${stat.accent ? "text-emerald-600" : "text-navy-900"}`}
                    >
                      <AnimatedNumber value={stat.value} />
                    </div>
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-500 sm:text-xs">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-xs leading-5 text-slate-400">
                Counts reflect active and returned reports across the Philippines
                today.
              </p>
            </div>

            {/* Quick facts */}
            <ul className="space-y-4">
              {[
                "Made for the Philippines — Luzon · Visayas · Mindanao",
                "Local & community-powered — neighbors helping neighbors return items",
                "Private by default — no passwords, OTPs, or banking details are ever needed",
                "Safety-first — a built-in guide for verifying reports and meeting in person",
              ].map((fact) => (
                <li key={fact} className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                    <Check size={12} className="text-emerald-600" />
                  </span>
                  <span className="text-sm leading-6 text-slate-600">{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* =========================================================
          BENEFITS
      ========================================================= */}

      <section className="border-y border-slate-200 bg-white/70">
        <div className="mx-auto grid max-w-7xl md:grid-cols-3">
          {benefits.map((item, index) => {
            const Icon = item.icon;

            return (
              <article
                key={item.number}
                className={[
                  "group p-8 transition-all duration-500 hover:bg-white sm:p-10 lg:p-12",
                  index !== 0
                    ? "border-t border-slate-200 md:border-l md:border-t-0"
                    : "",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-[0.15em] text-blue-500">
                    {item.number}
                  </span>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:border-blue-200 group-hover:bg-blue-50">
                    <Icon
                      aria-hidden="true"
                      size={18}
                      strokeWidth={1.5}
                      className="text-slate-500 transition-colors group-hover:text-blue-500"
                    />
                  </div>
                </div>

                <h3 className="mt-9 text-2xl font-semibold tracking-[-0.025em] text-navy-900">
                  {item.title}
                </h3>

                <p className="mt-3 max-w-sm text-sm leading-7 text-slate-500">
                  {item.text}
                </p>

                <div className="mt-8 h-px w-8 bg-blue-400/40 transition-all duration-500 group-hover:w-16 group-hover:bg-blue-500" />
              </article>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          STORY
      ========================================================= */}

      <section className="relative px-5 py-28 sm:px-6 lg:py-40">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-[.27fr_1fr]">

            {/* SIDE */}
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(37,119,231,.4)]" />

                  <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Our story
                  </span>
                </div>

                <div className="mt-8 border-l border-slate-200 pl-5">
                  <p className="text-[10px] font-medium leading-6 tracking-[0.15em] text-slate-400">
                    WHY
                    <br />
                    FINDBACK
                    <br />
                    EXISTS
                  </p>
                </div>
              </div>
            </aside>

            {/* CONTENT */}
            <div>
              <Eyebrow number="002">
                Why we exist
              </Eyebrow>

              <h2 className="mt-7 max-w-4xl text-4xl font-semibold leading-[1] tracking-[-0.05em] text-navy-900 sm:text-5xl lg:text-[4.5rem]">
                Sometimes a small item carries a{" "}
                <span className="text-blue-500">
                  big story.
                </span>
              </h2>

              <div className="mt-16 grid gap-14 lg:grid-cols-[1fr_.8fr]">
                <div className="space-y-7 text-base leading-8 text-slate-600 sm:text-lg">
                  <p>
                    A lost phone can hold years of memories. An ID can be
                    essential for everyday life. A wallet can contain things
                    that are difficult to replace.
                  </p>

                  <p>
                    And when you find something that belongs to someone else,
                    you may want to help — but simply do not know where to
                    start.
                  </p>

                  <p className="font-medium text-navy-900">
                    FindBack PH exists to make that first step easier.
                  </p>
                </div>

                <ul className="border-l border-slate-200 pl-7">
                  {storyChecklist.map((item, index) => (
                    <li
                      key={item}
                      className="group flex gap-4 border-b border-slate-200 py-5 first:pt-0 last:border-b-0"
                    >
                      <span className="font-mono text-[10px] text-blue-500">
                        0{index + 1}
                      </span>

                      <div className="flex items-start gap-3">
                        <CheckCircle2
                          aria-hidden="true"
                          size={16}
                          className="mt-1 shrink-0 text-blue-500 transition-transform group-hover:scale-110"
                        />

                        <span className="text-sm leading-6 text-slate-600">
                          {item}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quote */}
              <blockquote className="relative mt-20 border-y border-slate-200 py-12 sm:py-14">
                <div className="absolute left-0 top-0 h-px w-16 bg-blue-500" />

                <div className="flex gap-5">
                  <HeartHandshake
                    aria-hidden="true"
                    size={25}
                    strokeWidth={1.4}
                    className="mt-1 shrink-0 text-blue-500"
                  />

                  <p className="max-w-4xl text-2xl font-medium leading-9 tracking-[-0.025em] text-navy-900 sm:text-3xl sm:leading-10">
                    “The goal isn&apos;t just to find things. It&apos;s to help people
                    find their way back to something that matters.”
                  </p>
                </div>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          HOW IT WORKS
      ========================================================= */}

      <section id="process" className="scroll-mt-28 border-y border-slate-200 bg-white/60 px-5 py-28 sm:px-6 lg:py-40">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-[.4fr_1fr]">

            <div>
              <Eyebrow number="003">
                The process
              </Eyebrow>

              <h2 className="mt-7 text-4xl font-semibold leading-[.96] tracking-[-0.05em] text-navy-900 sm:text-5xl lg:text-[4.5rem]">
                From lost
                <br />
                to found.
              </h2>

              <p className="mt-7 max-w-sm text-base leading-7 text-slate-500">
                Simple by design. Every step brings people a little closer
                to a successful return.
              </p>
            </div>

            <div>
              {steps.map((step) => {
                const Icon = step.icon;

                return (
                  <article
                    key={step.number}
                    className="group grid gap-6 border-t border-slate-200 py-10 sm:grid-cols-[80px_1fr] lg:grid-cols-[100px_1fr]"
                  >
                    <div>
                      <span className="font-mono text-xs text-blue-500">
                        {step.number}
                      </span>
                    </div>

                    <div className="max-w-2xl">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                          <Icon
                            aria-hidden="true"
                            size={18}
                            strokeWidth={1.5}
                            className="text-blue-500 transition-transform group-hover:scale-110"
                          />
                        </div>

                        <h3 className="text-2xl font-semibold tracking-[-0.025em] text-navy-900 transition-colors group-hover:text-blue-600 sm:text-3xl">
                          {step.title}
                        </h3>
                      </div>

                      <p className="mt-5 text-base leading-8 text-slate-500 sm:text-lg">
                        {step.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          MISSION
      ========================================================= */}

      <section id="mission" className="scroll-mt-28 px-5 py-28 sm:px-6 lg:py-44">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-5xl">
            <div className="flex items-center gap-3">
              <Sparkles
                aria-hidden="true"
                size={16}
                strokeWidth={1.5}
                className="text-blue-500"
              />

              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-blue-600">
                Our mission
              </span>
            </div>

            <h2 className="mt-8 text-5xl font-semibold leading-[.95] tracking-[-0.06em] text-navy-900 sm:text-6xl lg:text-[6.1rem]">
              Make
              <span className="text-slate-300">
                {" "}helping{" "}
              </span>
              each other
              <span className="text-blue-500">
                {" "}easier.
              </span>
            </h2>

            <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_.65fr]">
              <p className="max-w-3xl text-xl leading-9 text-slate-600">
                FindBack PH exists to make lost-and-found easier, safer,
                and more accessible for communities across the Philippines.
              </p>

              <div className="border-l border-slate-200 pl-6">
                <p className="text-sm leading-7 text-slate-500">
                  We believe technology should make good intentions easier
                  to act on — whether you&apos;re searching for something you&apos;ve
                  lost or trying to return something you&apos;ve found.
                </p>

                <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-3">
                  {missionValues.map((item) => (
                    <li key={item}>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-500 transition-colors hover:text-blue-600">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          VALUES
      ========================================================= */}

      <section id="values" className="scroll-mt-28 border-y border-slate-200 bg-white/60 px-5 py-28 sm:px-6 lg:py-40">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-14 lg:grid-cols-[.42fr_1fr]">

            <div>
              <Eyebrow number="004">
                What we believe
              </Eyebrow>

              <h2 className="mt-7 max-w-md text-4xl font-semibold leading-[.98] tracking-[-0.05em] text-navy-900 sm:text-5xl">
                People are at the center.
              </h2>

              <p className="mt-6 max-w-sm text-base leading-7 text-slate-500">
                The technology matters, but the people behind every lost
                and found story matter more.
              </p>
            </div>

            <div>
              {values.map((value) => {
                const Icon = value.icon;

                return (
                  <article
                    key={value.number}
                    className="group border-t border-slate-200 py-9 first:pt-0"
                  >
                    <div className="grid gap-5 sm:grid-cols-[60px_1fr_auto]">
                      <span className="font-mono text-xs text-blue-500">
                        {value.number}
                      </span>

                      <div>
                        <div className="flex items-center gap-3">
                          <Icon
                            aria-hidden="true"
                            size={19}
                            strokeWidth={1.5}
                            className="text-slate-400 transition-colors group-hover:text-blue-500"
                          />

                          <h3 className="text-2xl font-semibold tracking-[-0.025em] text-navy-900 transition-colors group-hover:text-blue-600">
                            {value.title}
                          </h3>
                        </div>

                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                          {value.description}
                        </p>
                      </div>

                      <ArrowRight
                        aria-hidden="true"
                        size={18}
                        className="hidden text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-blue-500 sm:block"
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PHILIPPINES
      ========================================================= */}

      <section className="relative px-5 py-28 sm:px-6 lg:py-40">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-16 lg:grid-cols-[1fr_.9fr]">

            {/* VISUAL */}
            <div
              aria-hidden="true"
              className="relative min-h-[450px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,.05)]"
            >
              {/* Grid */}
              <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, rgba(37,119,231,.9) 1px, transparent 1px)",
                  backgroundSize: "30px 30px",
                }}
              />

              {/* Glow */}
              <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-200/30 blur-3xl" />

              {/* Lines */}
              <div className="absolute left-[10%] top-[35%] h-px w-[75%] rotate-[12deg] bg-blue-400/15" />

              <div className="absolute left-[18%] top-[58%] h-px w-[68%] -rotate-[16deg] bg-blue-400/15" />

              <div className="absolute left-[48%] top-[10%] h-[80%] w-px rotate-[20deg] bg-blue-400/10" />

              {/* Nodes */}
              {networkNodes.map((node) => (
                <div
                  key={node.label}
                  className={`absolute ${node.x} ${node.y} group`}
                >
                  <div className="absolute -inset-5 rounded-full bg-blue-400/10 blur-xl transition-all duration-500 group-hover:bg-blue-400/20" />

                  <div className="relative h-3 w-3 rounded-full border border-blue-300 bg-blue-400 shadow-[0_0_20px_rgba(37,119,231,.35)]" />

                  <span className="absolute left-5 top-[-5px] whitespace-nowrap text-[8px] font-medium tracking-[0.16em] text-slate-400">
                    {node.label}
                  </span>
                </div>
              ))}

              {/* Globe */}
              <div className="absolute right-7 top-7">
                <Globe2
                  size={27}
                  strokeWidth={1}
                  className="text-blue-500/40"
                />
              </div>

              {/* Bottom label */}
              <div className="absolute bottom-8 left-8 max-w-xs">
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-blue-500">
                  Built for the Philippines
                </p>

                <p className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.03em] text-navy-900">
                  Local connections can create nationwide impact.
                </p>
              </div>
            </div>

            {/* CONTENT */}
            <div>
              <Eyebrow number="005">
                Built for PH
              </Eyebrow>

              <h2 className="mt-7 text-4xl font-semibold leading-[.95] tracking-[-0.05em] text-navy-900 sm:text-5xl lg:text-[4.5rem]">
                One shared
                <br />
                <span className="text-blue-500">
                  community.
                </span>
              </h2>

              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-500">
                FindBack PH is designed around the way real communities
                connect — reducing friction, encouraging responsible
                communication, and making it easier to return lost
                belongings.
              </p>

              <ul className="mt-10">
                <li className="group flex gap-5 border-t border-slate-200 py-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white transition-all duration-300 group-hover:border-blue-200 group-hover:bg-blue-50">
                    <MapPin
                      aria-hidden="true"
                      size={18}
                      strokeWidth={1.5}
                      className="text-slate-500 transition-colors group-hover:text-blue-500"
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-navy-900">
                      Made for local communities
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Connect lost and found reports with people in
                      communities across Luzon, Visayas, and Mindanao.
                    </p>
                  </div>
                </li>

                <li className="group flex gap-5 border-t border-slate-200 py-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white transition-all duration-300 group-hover:border-blue-200 group-hover:bg-blue-50">
                    <Fingerprint
                      aria-hidden="true"
                      size={18}
                      strokeWidth={1.5}
                      className="text-slate-500 transition-colors group-hover:text-blue-500"
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-navy-900">
                      Privacy conscious
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Helping someone should not require exposing more
                      personal information than necessary.
                    </p>
                  </div>
                </li>

                <li className="group flex gap-5 border-y border-slate-200 py-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white transition-all duration-300 group-hover:border-blue-200 group-hover:bg-blue-50">
                    <HeartHandshake
                      aria-hidden="true"
                      size={18}
                      strokeWidth={1.5}
                      className="text-slate-500 transition-colors group-hover:text-blue-500"
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-navy-900">
                      Built around kindness
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      A simple act of returning something can make a
                      meaningful difference in someone&apos;s day.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SAFETY / REPORT SECTION
          Inspired by the screenshot you provided
      ========================================================= */}

      <section id="safety" className="scroll-mt-28 border-t border-slate-200 bg-white px-5 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Report suspicious activity */}
          <div className="group flex flex-col gap-8 border-y border-red-200 py-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50">
                <ShieldCheck
                  size={19}
                  strokeWidth={1.5}
                  className="text-red-600"
                />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-red-600">
                  Help protect the community
                </p>

                <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-navy-900">
                  See something suspicious?
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                  Report scams, fake listings, harassment, impersonation,
                  or other unsafe behavior through the available reporting
                  tools.
                </p>
              </div>
            </div>

            <Link
              href="/report"
              className="group inline-flex shrink-0 items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-red-600 transition-colors hover:text-red-700"
            >
              Report suspicious activity

              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>

          {/* Immediate danger */}
          <div className="rounded-[1.75rem] border border-slate-200 bg-white/80 backdrop-blur-sm p-7 shadow-[0_15px_50px_rgba(15,23,42,.035)] sm:p-9">
            <div className="flex items-start gap-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
                <MessageCircle
                  size={19}
                  strokeWidth={1.5}
                  className="text-slate-600"
                />
              </div>

              <div>
                <h3 className="text-base font-semibold text-navy-900">
                  In immediate danger?
                </h3>

                <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-500">
                  Prioritize your safety. Leave if possible and contact
                  appropriate local emergency services or authorities.
                  FindBack PH is not a replacement for emergency services.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================= */}

      <section className="relative border-t border-slate-200 px-5 py-28 sm:px-6 lg:py-40">
        <div className="mx-auto max-w-5xl text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-blue-200 bg-white shadow-[0_15px_50px_rgba(37,119,231,.1)]">
            <HeartHandshake
              size={27}
              strokeWidth={1.4}
              className="text-blue-500"
            />
          </div>

          <p className="mt-9 text-[10px] font-semibold uppercase tracking-[0.26em] text-blue-600">
            Be part of the connection
          </p>

          <h2 className="mx-auto mt-6 max-w-4xl text-5xl font-semibold leading-[.95] tracking-[-0.06em] text-navy-900 sm:text-6xl lg:text-[5.8rem]">
            What you found
            <span className="block text-blue-500">
              might mean everything to someone.
            </span>
          </h2>

          <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-slate-500 sm:text-lg">
            Search existing reports, report something you&apos;ve lost, or help
            someone in your community get an important belonging back.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/search">
              Search Reports
            </ButtonLink>

            <ButtonLink
              href="/report/lost"
              variant="secondary"
              icon={Plus}
            >
              Report an Item
            </ButtonLink>
          </div>

          {/* Trust */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
            {[
              {
                icon: ShieldCheck,
                label: "Safety",
                color: "text-emerald-500",
              },
              {
                icon: Fingerprint,
                label: "Privacy",
                color: "text-blue-500",
              },
              {
                icon: Users,
                label: "Community",
                color: "text-blue-500",
              },
              {
                icon: HandHeart,
                label: "Kindness",
                color: "text-blue-500",
              },
            ].map(({ icon: Icon, label, color }, index, array) => (
              <div
                key={label}
                className="flex items-center gap-7"
              >
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <Icon
                    size={14}
                    className={color}
                    strokeWidth={1.6}
                  />
                  {label}
                </div>

                {index < array.length - 1 && (
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-16 border-t border-slate-200 pt-6">
            <div className="flex flex-col items-center justify-between gap-3 text-[9px] font-medium uppercase tracking-[0.22em] text-slate-400 sm:flex-row">
              <span>
                FINDBACK PH / COMMUNITY FIRST
              </span>

              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(31,196,136,.4)]" />
                Helping people reconnect
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
