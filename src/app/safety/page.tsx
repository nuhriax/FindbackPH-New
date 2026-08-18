"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CircleDot,
  Eye,
  Flag,
  HeartHandshake,
  Landmark,
  Lock,
  MapPin,
  MessageCircle,
  MoveRight,
  Phone,
  Radar,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Store,
  UserCheck,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";

/* =========================================================
   DATA
========================================================= */

const meetupPlaces: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: Building2,
    title: "Shopping malls",
    description:
      "Meet near security desks, customer-service areas, or busy entrances where staff and people are nearby.",
  },
  {
    icon: Store,
    title: "Cafés & restaurants",
    description:
      "Choose familiar places with staff, good lighting, and enough people around you.",
  },
  {
    icon: Landmark,
    title: "Barangay halls",
    description:
      "Recognized public locations can provide an additional layer of safety and accountability.",
  },
  {
    icon: Users,
    title: "Busy public spaces",
    description:
      "Look for places that are familiar, visible, accessible, and easy to leave.",
  },
];

const redFlags = [
  "They ask for money before returning an item.",
  "They ask for your OTP, verification code, or password.",
  "They request banking information or unnecessary personal details.",
  "They pressure you to meet somewhere private or isolated.",
  "They create urgency and don't give you time to think.",
  "They threaten you, make you uncomfortable, or refuse reasonable questions.",
];

const privacyItems = [
  "Password",
  "OTP / verification code",
  "Banking information",
  "Home address",
  "Unnecessary identification",
];

const preparationSteps = [
  "Verify the person and item details",
  "Choose a public, familiar location",
  "Tell someone where you're going",
  "Keep sensitive information private",
  "Leave if something feels wrong",
];

const verificationSteps = [
  {
    number: "01",
    icon: MessageCircle,
    label: "ASK",
    title: "Ask before revealing",
    description:
      "Let the other person describe details that demonstrate their connection to the item without revealing every answer yourself.",
  },
  {
    number: "02",
    icon: Eye,
    label: "COMPARE",
    title: "Compare what you hear",
    description:
      "Compare their answers with information you already know. Avoid accidentally giving away details they should have known.",
  },
  {
    number: "03",
    icon: CheckCircle2,
    label: "CONFIRM",
    title: "Confirm when comfortable",
    description:
      "Only continue when the details make sense and you feel completely comfortable with the handoff.",
  },
];

/* =========================================================
   SMALL REUSABLE COMPONENTS
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
      <span className="h-px w-7 bg-current opacity-50" />

      <span className="text-[10px] font-semibold uppercase tracking-[0.24em]">
        {number} / {children}
      </span>
    </div>
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
    <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2.5 text-xs text-slate-600 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <Icon size={14} className="text-emerald-600" />
      {children}
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function SafetyPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fafcfb] text-slate-900">

      {/* =====================================================
          GLOBAL ATMOSPHERE
      ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        {/* Blue atmosphere */}
        <div className="absolute left-1/2 top-[-22rem] h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-blue-400/[0.055] blur-[150px]" />

        {/* Emerald atmosphere */}
        <div className="absolute -left-48 top-[42%] h-[32rem] w-[32rem] rounded-full bg-emerald-300/[0.055] blur-[130px]" />

        {/* Lower blue atmosphere */}
        <div className="absolute -right-48 top-[72%] h-[32rem] w-[32rem] rounded-full bg-blue-300/[0.045] blur-[130px]" />

        {/* Very subtle vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(248,250,252,.28)_65%,rgba(226,232,240,.58)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1380px] px-5 sm:px-8 lg:px-12">

        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="relative flex min-h-[760px] items-center py-24 lg:min-h-[850px]">

          <div className="grid w-full items-center gap-20 lg:grid-cols-[1.05fr_.95fr]">

            {/* HERO COPY */}

            <div className="relative z-10 lg:pl-10">

              <div className="mb-8 flex items-center gap-3">

                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40" />

                  <span className="relative h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,.35)]" />
                </span>

                <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-700">
                  FindBack PH · Safety Center
                </span>

              </div>

              <h1 className="max-w-4xl font-display text-[4.2rem] font-medium leading-[0.88] tracking-[-0.07em] sm:text-7xl lg:text-[7rem]">

                Recover

                <span className="block text-slate-400">
                  without
                </span>

                <span className="block bg-gradient-to-r from-slate-900 via-blue-700 to-emerald-600 bg-clip-text text-transparent">
                  compromise.
                </span>

              </h1>

              <div className="mt-10 max-w-xl border-l-2 border-emerald-400/30 pl-6">

                <p className="text-base leading-8 text-slate-600 sm:text-lg">
                  A lost item should never cost you your safety, privacy,
                  or peace of mind.
                </p>

                <p className="mt-3 text-sm leading-7 text-slate-500">
                  Learn how to verify, meet, and recover with confidence.
                </p>

              </div>

              <div className="mt-9 flex flex-wrap gap-2.5">

                <GlassPill icon={ShieldCheck}>
                  Safety-first recovery
                </GlassPill>

                <GlassPill icon={Lock}>
                  Privacy protected
                </GlassPill>

                <GlassPill icon={UserCheck}>
                  Verify first
                </GlassPill>

              </div>

              <div className="mt-14 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">

                <ArrowDown
                  size={14}
                  className="animate-bounce text-blue-600"
                />

                Explore the safety guide

              </div>

            </div>

            {/* HERO SECURITY SYSTEM */}

            <div className="relative flex min-h-[520px] items-center justify-center">

              {/* Ambient glow */}

              <div className="absolute h-[430px] w-[430px] rounded-full bg-blue-500/[0.07] blur-[100px]" />

              {/* Outer orbit */}

              <div className="absolute h-[480px] w-[480px] rounded-full border border-slate-200/80" />

              <div className="absolute h-[360px] w-[360px] rounded-full border border-blue-100" />

              {/* Subtle rotating ring */}

              <div className="absolute h-[480px] w-[480px] animate-[spin_30s_linear_infinite] rounded-full border border-dashed border-blue-300/30 motion-reduce:animate-none" />

              {/* Security card */}

              <div className="relative w-full max-w-[410px] rounded-[2rem] border border-white bg-white/85 p-5 shadow-[0_35px_100px_rgba(15,23,42,0.12)] backdrop-blur-2xl">

                {/* Header */}

                <div className="flex items-center justify-between border-b border-slate-100 pb-5">

                  <div>

                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Recovery protocol
                    </p>

                    <p className="mt-1.5 text-sm font-semibold text-slate-900">
                      Safety status
                    </p>

                  </div>

                  <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5">

                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                    <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700">
                      Active
                    </span>

                  </div>

                </div>

                {/* Center */}

                <div className="relative flex flex-col items-center py-14">

                  <div className="absolute h-44 w-44 rounded-full bg-blue-500/[0.07] blur-3xl" />

                  <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-blue-100 bg-gradient-to-br from-white to-blue-50 shadow-[0_20px_60px_rgba(59,130,246,0.12)]">

                    <div className="absolute inset-3 rounded-full border border-slate-100" />

                    <ShieldCheck
                      size={54}
                      strokeWidth={1.1}
                      className="text-blue-600"
                    />

                  </div>

                  <p className="mt-7 text-lg font-semibold tracking-tight text-slate-900">
                    Protection active
                  </p>

                  <p className="mt-2 max-w-[240px] text-center text-xs leading-6 text-slate-400">
                    Verify identity, protect your information, and meet in
                    public.
                  </p>

                </div>

                {/* Status rows */}

                <div className="space-y-2">

                  {[
                    {
                      icon: UserCheck,
                      label: "Identity",
                      status: "Verify first",
                      color: "blue",
                    },
                    {
                      icon: Lock,
                      label: "Privacy",
                      status: "Protected",
                      color: "emerald",
                    },
                    {
                      icon: MapPin,
                      label: "Meetup",
                      status: "Public place",
                      color: "amber",
                    },
                  ].map((item) => {

                    const Icon = item.icon;

                    return (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3.5"
                      >

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">

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

                        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          {item.status}
                        </span>

                      </div>
                    );
                  })}

                </div>

              </div>

            </div>

          </div>
        </section>

        {/* =====================================================
            001 — SAFETY PROTOCOL
        ====================================================== */}

        <section className="border-t border-slate-200/80 py-28 sm:py-36">

          <div className="grid gap-14 lg:grid-cols-[.65fr_1.35fr]">

            <SectionEyebrow number="001">
              Recovery protocol
            </SectionEyebrow>

            <div>

              <h2 className="max-w-5xl font-display text-4xl font-medium leading-[.96] tracking-[-0.055em] sm:text-6xl lg:text-7xl">

                The safest recovery is the one

                <span className="text-slate-400">
                  {" "}you don&apos;t rush.
                </span>

              </h2>

              <p className="mt-7 max-w-2xl text-base leading-8 text-slate-500">
                Take a moment. Verify the person. Choose the right place.
                Protect your information. A few careful decisions can prevent
                a difficult situation.
              </p>

            </div>

          </div>

          <div className="mt-20 divide-y divide-slate-200/80 border-y border-slate-200/80">

            {[
              {
                number: "01",
                icon: ScanSearch,
                title: "Verify before you trust",
                text: "Ask questions that allow the other person to demonstrate their connection to the item without revealing all the answers.",
                color: "blue",
              },
              {
                number: "02",
                icon: MapPin,
                title: "Meet where people are",
                text: "Choose somewhere familiar, public, well-lit, and easy to leave. Never let someone pressure you into a private location.",
                color: "emerald",
              },
              {
                number: "03",
                icon: ShieldCheck,
                title: "Protect what is yours",
                text: "Your password, OTP, banking information, and private address should stay private — even during a legitimate recovery.",
                color: "blue",
              },
            ].map((item) => {

              const Icon = item.icon;

              return (
                <div
                  key={item.number}
                  className="group grid gap-6 py-10 transition-colors hover:bg-white/50 lg:grid-cols-[80px_1fr_1fr] lg:items-center lg:px-5"
                >

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <Icon
                      size={19}
                      className={
                        item.color === "emerald"
                          ? "text-emerald-600"
                          : "text-blue-600"
                      }
                    />

                  </div>

                  <div>

                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-400">
                      Step {item.number}
                    </span>

                    <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                      {item.title}
                    </h3>

                  </div>

                  <p className="max-w-xl text-sm leading-7 text-slate-500">
                    {item.text}
                  </p>

                </div>
              );
            })}

          </div>

        </section>

        {/* =====================================================
            002 — BEFORE YOU MEET
        ====================================================== */}

        <section className="py-28 sm:py-36">

          <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/70 shadow-[0_25px_80px_rgba(15,23,42,0.05)] backdrop-blur-xl">

            <div className="grid lg:grid-cols-[.85fr_1.15fr]">

              <div className="relative overflow-hidden p-8 sm:p-12 lg:p-16">

                <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/[0.07] blur-3xl" />

                <div className="relative">

                  <SectionEyebrow number="002">
                    Before you meet
                  </SectionEyebrow>

                  <h2 className="mt-7 max-w-xl font-display text-4xl font-medium leading-[.98] tracking-[-0.055em] sm:text-5xl lg:text-6xl">

                    A few minutes of preparation

                    <span className="text-slate-400">
                      {" "}can make a big difference.
                    </span>

                  </h2>

                  <p className="mt-7 max-w-md text-sm leading-7 text-slate-500">
                    Verify the details, choose your location carefully, and
                    make sure someone you trust knows where you&apos;re going.
                  </p>

                  <div className="mt-9 inline-flex items-center gap-3 rounded-full bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-700">

                    <HeartHandshake size={15} />

                    Someone should know where you are.

                  </div>

                </div>

              </div>

              <div className="border-t border-slate-200/80 bg-slate-50/60 p-8 sm:p-12 lg:border-l lg:border-t-0 lg:p-16">

                <div className="space-y-1">

                  {preparationSteps.map((item, index) => (

                    <div
                      key={item}
                      className="group flex items-center gap-5 border-b border-slate-200/80 py-6 last:border-0"
                    >

                      <span className="font-mono text-[9px] text-slate-300">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">

                        <Check
                          size={14}
                          className="text-emerald-600 transition-transform group-hover:scale-110"
                        />

                      </div>

                      <span className="text-sm font-medium text-slate-600 transition-colors group-hover:text-slate-900">
                        {item}
                      </span>

                    </div>
                  ))}

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            003 — SAFE MEETUPS
        ====================================================== */}

        <section className="border-t border-slate-200/80 py-28 sm:py-36">

          <div className="grid gap-16 lg:grid-cols-[.8fr_1.2fr] lg:items-center">

            <div>

              <SectionEyebrow number="003" color="blue">
                Safe meetups
              </SectionEyebrow>

              <h2 className="mt-7 font-display text-5xl font-medium leading-[.94] tracking-[-0.06em] sm:text-6xl">

                Choose somewhere

                <span className="block text-blue-600">
                  people are around.
                </span>

              </h2>

              <p className="mt-8 max-w-md text-base leading-8 text-slate-500">
                Public places make meetups safer and more comfortable.
                Avoid isolated areas and never let someone pressure you
                into changing the agreed location.
              </p>

              <div className="mt-8 flex max-w-md gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">

                <HeartHandshake
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <p className="text-sm leading-6 text-slate-600">
                  Tell a friend or family member where you&apos;re going and
                  when you expect to be back.
                </p>

              </div>

            </div>

            <div className="grid overflow-hidden rounded-[2rem] border border-slate-200/80 bg-slate-200/70 sm:grid-cols-2">

              {meetupPlaces.map((place, index) => {

                const Icon = place.icon;

                return (
                  <div
                    key={place.title}
                    className="group relative bg-white p-8 transition-all duration-300 hover:bg-slate-50"
                  >

                    <span className="absolute right-7 top-7 font-mono text-[9px] text-slate-300">
                      0{index + 1}
                    </span>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">

                      <Icon
                        size={18}
                        className="text-emerald-600"
                      />

                    </div>

                    <h3 className="mt-7 font-semibold text-slate-900">
                      {place.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {place.description}
                    </p>

                    <div className="mt-7 flex items-center gap-2 text-[8px] font-semibold uppercase tracking-[0.18em] text-slate-400">

                      <CircleDot
                        size={9}
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
            004 — PRIVACY
        ====================================================== */}

        <section className="py-28 sm:py-36">

          <div className="grid gap-16 lg:grid-cols-[1fr_.9fr] lg:items-center">

            <div>

              <SectionEyebrow number="004" color="red">
                Privacy perimeter
              </SectionEyebrow>

              <h2 className="mt-7 max-w-2xl font-display text-5xl font-medium leading-[.94] tracking-[-0.06em] sm:text-6xl lg:text-7xl">

                Your private information

                <span className="block text-slate-400">
                  stays private.
                </span>

              </h2>

              <p className="mt-8 max-w-lg text-base leading-8 text-slate-500">
                Recovering an item does not require handing over your digital
                identity. If someone asks for sensitive information, stop and
                reconsider the interaction.
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

              <div className="relative overflow-hidden rounded-[2rem] border border-red-100 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.08)]">

                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

                  <div className="flex items-center gap-3">

                    <span className="h-2 w-2 rounded-full bg-red-400" />

                    <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Sensitive information
                    </span>

                  </div>

                  <Lock
                    size={14}
                    className="text-red-500/60"
                  />

                </div>

                <div className="p-5">

                  {privacyItems.map((item, index) => (

                    <div
                      key={item}
                      className="flex items-center justify-between border-b border-slate-100 py-5 last:border-0"
                    >

                      <div className="flex items-center gap-4">

                        <span className="font-mono text-[9px] text-slate-300">
                          0{index + 1}
                        </span>

                        <span className="text-sm font-medium text-slate-600">
                          {item}
                        </span>

                      </div>

                      <XCircle
                        size={15}
                        className="text-red-400/50"
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
                      Legitimate recovery should never require your passwords,
                      OTPs, or banking credentials.
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            005 — VERIFY OWNERSHIP
        ====================================================== */}

        <section className="border-t border-slate-200/80 py-28 sm:py-36">

          <div className="grid gap-16 lg:grid-cols-[.7fr_1.3fr]">

            <div>

              <SectionEyebrow number="005" color="blue">
                Verify ownership
              </SectionEyebrow>

              <h2 className="mt-7 font-display text-5xl font-medium leading-[.94] tracking-[-0.06em] sm:text-6xl">

                Make sure it goes

                <span className="block text-blue-600">
                  to the right person.
                </span>

              </h2>

              <p className="mt-8 max-w-md text-sm leading-7 text-slate-500">
                Don&apos;t reveal every detail from your report. Let the person
                describe information that wasn&apos;t publicly visible.
              </p>

            </div>

            <div className="divide-y divide-slate-200/80 border-y border-slate-200/80">

              {verificationSteps.map((item) => {

                const Icon = item.icon;

                return (
                  <div
                    key={item.number}
                    className="group relative py-9 transition-colors hover:bg-white/60 sm:px-6"
                  >

                    <div className="flex gap-6">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">

                        <Icon
                          size={18}
                          className="text-blue-600"
                        />

                      </div>

                      <div className="flex-1 pr-8">

                        <div className="flex items-center gap-3">

                          <span className="font-mono text-[9px] text-slate-300">
                            {item.number}
                          </span>

                          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-600/60">
                            {item.label}
                          </span>

                        </div>

                        <h3 className="mt-2 text-xl font-semibold text-slate-900">
                          {item.title}
                        </h3>

                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                          {item.description}
                        </p>

                      </div>

                      <ArrowRight
                        size={17}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 opacity-0 transition-all duration-300 group-hover:right-3 group-hover:opacity-50"
                      />

                    </div>

                  </div>
                );
              })}

            </div>

          </div>

        </section>

        {/* =====================================================
            006 — RED FLAGS
        ====================================================== */}

        <section className="py-28 sm:py-36">

          <div className="mb-14 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

            <div>

              <SectionEyebrow number="006" color="amber">
                Threat detection
              </SectionEyebrow>

              <h2 className="mt-7 font-display text-5xl font-medium tracking-[-0.06em] sm:text-6xl">

                Know when to

                <span className="text-amber-600">
                  {" "}walk away.
                </span>

              </h2>

            </div>

            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-300">
              Signal analysis / 006
            </span>

          </div>

          <div className="grid overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white sm:grid-cols-2">

            {redFlags.map((item, index) => (

              <div
                key={item}
                className={`group relative p-7 transition-colors duration-300 hover:bg-amber-50/60 sm:p-8 ${
                  index < 4
                    ? "border-b border-slate-200/80"
                    : ""
                } ${
                  index % 2 === 0
                    ? "sm:border-r sm:border-slate-200/80"
                    : ""
                }`}
              >

                <div className="flex gap-5">

                  <span className="font-mono text-[10px] text-amber-500/40">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="flex-1">

                    <div className="mb-4 flex items-center gap-2">

                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />

                      <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Warning signal
                      </span>

                    </div>

                    <p className="text-sm leading-7 text-slate-600">
                      {item}
                    </p>

                  </div>

                  <AlertTriangle
                    size={15}
                    className="text-amber-400/40 transition-colors group-hover:text-amber-500"
                  />

                </div>

              </div>
            ))}

          </div>

          <div className="mt-7 flex items-center gap-3 text-xs font-medium text-amber-700/70">

            <Radar size={15} />

            If something feels wrong, you are allowed to stop.

          </div>

        </section>

        {/* =====================================================
            007 — CONTROL
        ====================================================== */}

        <section className="border-t border-slate-200/80 py-28 sm:py-36">

          <div className="mx-auto max-w-4xl text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">

              <ShieldCheck
                size={25}
                className="text-blue-600"
              />

            </div>

            <div className="mt-7 flex items-center justify-center">
              <SectionEyebrow number="007" color="blue">
                You are in control
              </SectionEyebrow>
            </div>

            <h2 className="mt-7 font-display text-5xl font-medium tracking-[-0.065em] sm:text-6xl lg:text-7xl">

              You can always

              <span className="text-emerald-600">
                {" "}say no.
              </span>

            </h2>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-500">
              Pause a conversation. Ask more questions. Cancel a meetup.
              Leave a situation. Report something that doesn&apos;t feel right.
            </p>

            <div className="mt-12 grid grid-cols-2 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white sm:grid-cols-4">

              {[
                {
                  icon: Eye,
                  label: "Pause",
                },
                {
                  icon: MessageCircle,
                  label: "Ask",
                },
                {
                  icon: MoveRight,
                  label: "Leave",
                },
                {
                  icon: Flag,
                  label: "Report",
                },
              ].map(({ icon: Icon, label }, index) => (

                <div
                  key={label}
                  className={`group flex flex-col items-center justify-center py-9 transition-colors hover:bg-slate-50 ${
                    index % 2 === 0
                      ? "border-r border-slate-200/80 sm:border-r"
                      : ""
                  } ${
                    index < 2
                      ? "border-b border-slate-200/80 sm:border-b-0"
                      : ""
                  }`}
                >

                  <Icon
                    size={20}
                    className="text-blue-600 transition-transform duration-300 group-hover:-translate-y-1"
                  />

                  <span className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {label}
                  </span>

                </div>

              ))}

            </div>

          </div>

        </section>

        {/* =====================================================
            REPORT + EMERGENCY
            MERGED PREMIUM SUPPORT PANEL
        ====================================================== */}

        <section className="relative py-16 sm:py-24">

          <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_25px_80px_rgba(15,23,42,0.06)] backdrop-blur-xl">

            {/* =================================================
                REPORT
            ================================================== */}

            <div className="border-b border-red-100/80 bg-gradient-to-r from-red-50/50 via-white to-white px-6 py-8 sm:px-10 sm:py-9 lg:px-12">

              <div className="flex flex-col gap-7 lg:flex-row lg:items-center">

                {/* Icon */}

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-100 bg-red-50">

                  <Flag
                    size={18}
                    strokeWidth={1.7}
                    className="text-red-500"
                  />

                </div>

                {/* Content */}

                <div className="min-w-0 flex-1">

                  <div className="flex items-center gap-2">

                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />

                    <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-red-600">
                      Help protect the community
                    </span>

                  </div>

                  <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                    See something suspicious?
                  </h2>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    Report scams, fake listings, harassment, impersonation,
                    or other unsafe behavior through the available reporting
                    tools.
                  </p>

                </div>

                {/* Action */}

                <button
                  type="button"
                  className="group inline-flex shrink-0 items-center gap-2 self-start text-[10px] font-semibold uppercase tracking-[0.16em] text-red-600 transition-colors hover:text-red-700 lg:self-center"
                >

                  Report suspicious activity

                  <MoveRight
                    size={16}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />

                </button>

              </div>

            </div>

            {/* =================================================
                EMERGENCY
            ================================================== */}

            <div className="bg-slate-50/60 px-6 py-8 sm:px-10 sm:py-9 lg:px-12">

              <div className="flex flex-col gap-7 sm:flex-row sm:items-start">

                {/* Icon */}

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">

                  <Phone
                    size={18}
                    strokeWidth={1.7}
                    className="text-slate-600"
                  />

                </div>

                {/* Content */}

                <div className="flex-1">

                  <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Safety first
                  </span>

                  <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                    In immediate danger?
                  </h2>

                  <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-500">
                    Prioritize your safety. Leave if possible and contact
                    appropriate local emergency services or authorities.
                    FindBack PH is not a replacement for emergency services.
                  </p>

                </div>

                {/* Safety indicator */}

                <div className="hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 sm:flex">

                  <ShieldCheck
                    size={14}
                    className="text-emerald-600"
                  />

                  <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Safety first
                  </span>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            FINAL PRINCIPLE
        ====================================================== */}

        <section className="relative overflow-hidden py-36 text-center sm:py-48">

          {/* Atmosphere */}

          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300/[0.08] blur-[130px]" />

          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200/70" />

          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/70" />

          <div className="relative mx-auto max-w-5xl">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 shadow-[0_0_70px_rgba(16,185,129,.07)]">

              <HeartHandshake
                size={31}
                strokeWidth={1.2}
                className="text-emerald-600"
              />

            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-[9px] font-semibold uppercase tracking-[0.3em] text-emerald-700">

              <Sparkles size={13} />

              The FindBack principle

            </div>

            <h2 className="mt-8 font-display text-5xl font-medium leading-[.9] tracking-[-0.07em] sm:text-6xl lg:text-[7rem]">

              The item can wait.

              <span className="block text-emerald-600">
                Your safety can&apos;t.
              </span>

            </h2>

            <p className="mx-auto mt-9 max-w-xl text-base leading-8 text-slate-500">
              If something doesn&apos;t feel right, you don&apos;t owe anyone a
              meetup, an explanation, or your personal information.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-2.5">

              <GlassPill icon={ShieldCheck}>
                Protect yourself
              </GlassPill>

              <GlassPill icon={Users}>
                Look out for others
              </GlassPill>

            </div>

            <div className="mt-12 flex items-center justify-center gap-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">

              <ShieldCheck
                size={14}
                className="text-emerald-500"
              />

              Safety is everyone&apos;s responsibility

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}