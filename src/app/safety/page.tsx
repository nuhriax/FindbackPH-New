"use client";

import {
  ShieldCheck,
  MapPin,
  Lock,
  AlertTriangle,
  Users,
  Flag,
  CheckCircle,
  XCircle,
  Eye,
  ArrowDown,
  UserCheck,
  HeartHandshake,
  Building2,
  Store,
  Landmark,
  Phone,
  MessageCircle,
  Sparkles,
  ScanSearch,
  Radar,
  MoveRight,
  CircleDot,
} from "lucide-react";

export default function SafetyPage() {
  const meetupPlaces = [
    {
      icon: Building2,
      title: "Shopping malls",
      text: "Busy entrances, security areas, customer-service zones, or other visible locations.",
    },
    {
      icon: Store,
      title: "Cafés & restaurants",
      text: "Choose familiar places with staff, lighting, and other people nearby.",
    },
    {
      icon: Landmark,
      title: "Barangay halls",
      text: "Recognized public locations can provide an additional layer of safety.",
    },
    {
      icon: Users,
      title: "Busy public spaces",
      text: "Look for places that are familiar, visible, accessible, and well-lit.",
    },
  ];

  const redFlags = [
    "They ask for money before returning an item.",
    "They ask for your OTP, verification code, or password.",
    "They request banking information or unnecessary personal details.",
    "They pressure you to meet somewhere private or isolated.",
    "They create urgency and don't give you time to think.",
    "They make you uncomfortable, threaten you, or refuse reasonable questions.",
  ];

  const privacyItems = [
    "Password",
    "OTP / verification code",
    "Banking information",
    "Home address",
    "Unnecessary identification",
  ];

  const verificationSteps = [
    {
      number: "01",
      icon: MessageCircle,
      title: "Verify before you trust",
      label: "ASK",
      text: "Ask the person to describe details that allow them to demonstrate their connection to the item without you revealing every answer.",
    },
    {
      number: "02",
      icon: Eye,
      title: "Compare what you hear",
      label: "COMPARE",
      text: "Compare their answers with your information. Be careful not to accidentally reveal details they should already know.",
    },
    {
      number: "03",
      icon: CheckCircle,
      title: "Confirm when comfortable",
      label: "CONFIRM",
      text: "Only continue with the handoff when the details make sense and you feel completely comfortable.",
    },
  ];

  const preparationSteps = [
    "Verify the person and item details",
    "Choose a public, familiar location",
    "Tell someone where you're going",
    "Keep sensitive information private",
    "Leave if something feels wrong",
  ];

  return (
    <main className="min-h-screen overflow-hidden text-navy-900">

      {/* =========================================================
          GLOBAL ATMOSPHERE
      ========================================================== */}

      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Main blue atmosphere */}
        <div className="absolute left-[55%] top-[-420px] h-[850px] w-[850px] -translate-x-1/2 rounded-full bg-blue-500/[0.045] blur-[190px]" />

        {/* Green atmosphere */}
        <div className="absolute -left-[350px] top-[1800px] h-[700px] w-[700px] rounded-full bg-emerald-50 blur-[180px]" />

        {/* Blue lower atmosphere */}
        <div className="absolute -right-[350px] top-[3500px] h-[700px] w-[700px] rounded-full bg-blue-500/[0.025] blur-[180px]" />

        {/* Fine grid */}
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.5) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(241,245,249,.35)_70%,rgba(226,232,240,.7)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">

        {/* =======================================================
            HERO
        ======================================================== */}

        <section className="relative min-h-[820px] overflow-hidden">

          {/* Editorial guide lines */}

          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[7%] top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-slate-300/40 to-transparent lg:block" />

            <div className="absolute left-0 right-0 top-[49%] h-px bg-gradient-to-r from-transparent via-slate-300/40 to-transparent" />
          </div>

          <div className="grid min-h-[820px] items-center gap-14 lg:grid-cols-[.92fr_1.08fr]">

            {/* ===================================================
                HERO COPY
            ==================================================== */}

            <div className="relative z-20 py-24 lg:pl-16">

              <div className="mb-10 flex items-center gap-4">

                <div className="relative h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40" />
                  <span className="relative block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,.5)]" />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-emerald-600">
                  FindBack PH / Safety Center
                </span>

                <span className="hidden h-px w-14 bg-slate-50 sm:block" />

                <span className="hidden font-mono text-[8px] tracking-[0.2em] text-slate-700 sm:block">
                  SYSTEM_READY
                </span>

              </div>

              <h1 className="max-w-5xl font-display text-[4rem] font-semibold leading-[0.86] tracking-[-0.07em] sm:text-7xl lg:text-[7.25rem]">

                Recover

                <span className="block text-slate-500">
                  without
                </span>

                <span className="block bg-gradient-to-r from-slate-800 via-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  compromise.
                </span>

              </h1>

              <div className="mt-10 max-w-xl border-l border-emerald-200 pl-6">

                <p className="text-base leading-8 text-slate-600 sm:text-lg">
                  A lost item should never cost you your safety, privacy,
                  or peace of mind.
                </p>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Learn how to verify, meet, and recover with confidence.
                </p>

              </div>

              {/* Safety pills */}

              <div className="mt-10 flex flex-wrap gap-3">

                <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-600 shadow-2xl backdrop-blur-xl">
                  <ShieldCheck
                    size={14}
                    className="text-emerald-600"
                  />
                  Safety-first recovery
                </div>

                <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-600 shadow-2xl backdrop-blur-xl">
                  <Lock
                    size={14}
                    className="text-blue-600"
                  />
                  Privacy protected
                </div>

                <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-600 shadow-2xl backdrop-blur-xl">
                  <UserCheck
                    size={14}
                    className="text-emerald-600"
                  />
                  Verify first
                </div>

              </div>

              <div className="mt-16 flex items-center gap-4 text-[10px] uppercase tracking-[0.24em] text-slate-700">
                <ArrowDown
                  size={15}
                  className="animate-bounce text-blue-600"
                />

                Continue through the safety guide
              </div>

            </div>

            {/* ===================================================
                HERO SECURITY SYSTEM
            ==================================================== */}

            <div className="relative flex min-h-[650px] items-center justify-center">

              {/* Outer rings */}

              <div className="absolute h-[600px] w-[600px] rounded-full border border-slate-200" />

              <div className="absolute h-[500px] w-[500px] rounded-full border border-blue-200" />

              <div className="absolute h-[400px] w-[400px] rounded-full border border-blue-200" />

              <div className="absolute h-[300px] w-[300px] rounded-full border border-emerald-200" />

              {/* Rotating ring */}

              <div className="absolute h-[600px] w-[600px] animate-[spin_24s_linear_infinite] rounded-full border border-transparent border-r-emerald-400/10 border-t-blue-400/25" />

              <div className="absolute h-[470px] w-[470px] animate-[spin_17s_linear_infinite_reverse] rounded-full border border-transparent border-b-blue-400/15" />

              {/* Crosshair */}

              <div className="absolute h-[600px] w-px bg-gradient-to-b from-transparent via-blue-300/40 to-transparent" />

              <div className="absolute h-px w-[600px] bg-gradient-to-r from-transparent via-blue-300/40 to-transparent" />

              {/* Center atmosphere */}

              <div className="absolute h-80 w-80 rounded-full bg-blue-500/[0.045] blur-[100px]" />

              {/* Main core */}

              <div className="relative flex h-52 w-52 items-center justify-center rounded-full border border-slate-200 bg-white/95 shadow-[0_0_120px_rgba(59,130,246,.12)] backdrop-blur-2xl">

                <div className="absolute inset-5 rounded-full border border-slate-200" />

                <div className="absolute inset-10 rounded-full border border-blue-200" />

                <ShieldCheck
                  size={82}
                  strokeWidth={0.8}
                  className="relative text-blue-600"
                />

                <div className="absolute -bottom-5 rounded-full border border-emerald-200 bg-white px-5 py-2.5 shadow-2xl">

                  <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.25em] text-emerald-600">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.7)]" />
                    Protection active
                  </span>

                </div>

              </div>

              {/* Floating security module */}

              <div className="absolute left-[0%] top-[13%] rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-2xl backdrop-blur-xl">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                    <Lock
                      size={15}
                      className="text-emerald-600"
                    />
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-navy-900">
                      Privacy
                    </p>

                    <p className="mt-1 font-mono text-[8px] tracking-[0.15em] text-slate-600">
                      PROTECTED
                    </p>
                  </div>

                </div>

              </div>

              {/* Identity module */}

              <div className="absolute right-[0%] top-[22%] rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-2xl backdrop-blur-xl">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                    <UserCheck
                      size={15}
                      className="text-blue-600"
                    />
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-navy-900">
                      Identity
                    </p>

                    <p className="mt-1 font-mono text-[8px] tracking-[0.15em] text-slate-600">
                      VERIFY FIRST
                    </p>
                  </div>

                </div>

              </div>

              {/* Meetup module */}

              <div className="absolute bottom-[13%] left-[7%] rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-2xl backdrop-blur-xl">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
                    <MapPin
                      size={15}
                      className="text-amber-600"
                    />
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-navy-900">
                      Meetup
                    </p>

                    <p className="mt-1 font-mono text-[8px] tracking-[0.15em] text-slate-600">
                      PUBLIC PLACE
                    </p>
                  </div>

                </div>

              </div>

              {/* Signal points */}

              <span className="absolute right-[16%] top-[9%] h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,.7)]" />

              <span className="absolute bottom-[16%] right-[18%] h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400 shadow-[0_0_20px_rgba(59,130,246,.7)]" />

              <span className="absolute left-[20%] top-[42%] h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,.5)]" />

            </div>

          </div>
        </section>

        {/* =======================================================
            SECTION 001 — SAFETY PROTOCOL
        ======================================================== */}

        <section className="relative border-t border-slate-200 py-32 sm:py-40">

          <div className="mb-20 grid gap-10 lg:grid-cols-[.7fr_1.3fr]">

            <div>

              <div className="flex items-center gap-3">

                <span className="h-px w-8 bg-blue-400" />

                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-blue-600">
                  001 / Recovery Protocol
                </span>

              </div>

            </div>

            <div>

              <h2 className="max-w-5xl font-display text-4xl font-semibold leading-[1] tracking-[-0.05em] sm:text-6xl lg:text-7xl">

                The safest recovery

                <span className="text-slate-600">
                  {" "}is the one you don&apos;t rush.
                </span>

              </h2>

              <p className="mt-7 max-w-2xl text-base leading-8 text-slate-500">
                Take a moment. Verify the person. Choose the right place.
                Protect your information. A few careful decisions can prevent
                a difficult situation.
              </p>

            </div>

          </div>

          {/* Timeline */}

          <div className="relative">

            <div className="absolute bottom-0 left-[31px] top-0 hidden w-px bg-gradient-to-b from-blue-300 via-slate-300/40 to-transparent lg:block" />

            {[
              {
                number: "01",
                icon: ScanSearch,
                title: "Verify before you trust",
                text: "Ask questions that allow the other person to demonstrate their connection to the item without you revealing all the answers.",
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
                  className="group relative grid gap-8 border-t border-slate-200 py-10 lg:grid-cols-[64px_1fr_1.2fr] lg:items-center"
                >

                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white shadow-xl">

                    <Icon
                      size={20}
                      className={
                        item.color === "emerald"
                          ? "text-emerald-600"
                          : "text-blue-600"
                      }
                    />

                  </div>

                  <div>

                    <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-700">
                      Step {item.number}
                    </span>

                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-navy-900">
                      {item.title}
                    </h3>

                  </div>

                  <p className="max-w-xl text-sm leading-7 text-slate-500 transition-colors duration-500 group-hover:text-slate-600">
                    {item.text}
                  </p>

                </div>
              );
            })}

          </div>
        </section>

        {/* =======================================================
            SECTION 002 — BEFORE YOU MEET
        ======================================================== */}

        <section className="relative py-32 sm:py-40">

          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-gradient-to-br from-slate-50 via-slate-300/40 to-transparent">

            {/* Decorative number */}

            <div className="pointer-events-none absolute -right-8 -top-16 select-none font-display text-[14rem] font-bold leading-none tracking-[-0.1em] text-navy-900/[0.05]">
              02
            </div>

            <div className="grid gap-16 p-8 sm:p-12 lg:grid-cols-[.8fr_1.2fr] lg:p-16">

              <div>

                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-emerald-600">
                  Before you meet
                </span>

                <h2 className="mt-6 font-display text-4xl font-semibold leading-[.98] tracking-[-0.05em] sm:text-5xl lg:text-6xl">

                  A few minutes of preparation

                  <span className="text-slate-600">
                    {" "}can make a big difference.
                  </span>

                </h2>

                <p className="mt-7 max-w-md text-sm leading-7 text-slate-500">
                  Before meeting someone, verify the details, choose your
                  location carefully, and make sure someone you trust knows
                  where you&apos;re going.
                </p>

                <div className="mt-9 flex items-center gap-3 text-xs text-slate-600">
                  <HeartHandshake
                    size={17}
                    className="text-emerald-600"
                  />
                  Someone should know where you are.
                </div>

              </div>

              <div className="border-l border-slate-200 pl-7 sm:pl-10">

                {preparationSteps.map((item, index) => (
                  <div
                    key={item}
                    className="group flex items-center gap-5 border-b border-slate-200 py-6 first:pt-0 last:border-0"
                  >

                    <span className="font-mono text-[9px] text-blue-600/40">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <CheckCircle
                      size={17}
                      className="shrink-0 text-emerald-600/70 transition-transform duration-300 group-hover:scale-110"
                    />

                    <span className="text-sm text-slate-600 transition-colors group-hover:text-navy-900">
                      {item}
                    </span>

                  </div>
                ))}

              </div>

            </div>

          </div>

        </section>

        {/* =======================================================
            SECTION 003 — SAFE MEETUPS
        ======================================================== */}

        <section className="relative border-t border-slate-200 py-32 sm:py-40">

          <div className="grid items-center gap-20 lg:grid-cols-[.8fr_1.2fr]">

            <div>

              <div className="flex items-center gap-3">

                <MapPin
                  size={17}
                  className="text-blue-600"
                />

                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-blue-600">
                  003 / Safe Meetups
                </span>

              </div>

              <h2 className="mt-6 font-display text-5xl font-semibold leading-[.95] tracking-[-0.055em] sm:text-6xl lg:text-7xl">

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

              <div className="mt-9 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">

                <HeartHandshake
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <span className="text-sm leading-6 text-slate-500">
                  Tell a friend or family member where you&apos;re going and
                  when you expect to be back.
                </span>

              </div>

            </div>

            {/* Location matrix */}

            <div className="grid gap-px overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 sm:grid-cols-2">

              {meetupPlaces.map((place, index) => {

                const Icon = place.icon;

                return (
                  <div
                    key={place.title}
                    className="group relative bg-white p-8 transition-all duration-500 hover:bg-slate-50"
                  >

                    <div className="absolute right-6 top-6 font-mono text-[8px] text-slate-800">
                      0{index + 1}
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 transition-all duration-500 group-hover:border-emerald-200 group-hover:bg-emerald-50">

                      <Icon
                        size={19}
                        className="text-emerald-600"
                      />

                    </div>

                    <h3 className="mt-7 text-base font-semibold">
                      {place.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-slate-600 transition-colors group-hover:text-slate-600">
                      {place.text}
                    </p>

                    <div className="mt-7 flex items-center gap-2 text-[8px] font-mono uppercase tracking-[0.2em] text-slate-700">
                      <CircleDot
                        size={10}
                        className="text-emerald-600/60"
                      />
                      Public environment
                    </div>

                  </div>
                );
              })}

            </div>

          </div>

        </section>

        {/* =======================================================
            SECTION 004 — PRIVACY VAULT
        ======================================================== */}

        <section className="relative py-32 sm:py-40">

          <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-red-200 to-transparent" />

          <div className="grid items-center gap-20 lg:grid-cols-[1fr_.9fr]">

            <div>

              <div className="flex items-center gap-3">

                <Lock
                  size={17}
                  className="text-red-600"
                />

                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-red-600">
                  004 / Privacy perimeter
                </span>

              </div>

              <h2 className="mt-6 max-w-2xl font-display text-5xl font-semibold leading-[.94] tracking-[-0.055em] sm:text-6xl lg:text-7xl">

                Your private information

                <span className="block text-slate-600">
                  stays private.
                </span>

              </h2>

              <p className="mt-8 max-w-lg text-base leading-8 text-slate-500">
                Recovering an item does not require handing over your
                digital identity. If someone asks for sensitive information,
                stop and reconsider the interaction.
              </p>

              <div className="mt-9 flex items-center gap-3 text-xs text-slate-500">
                <ShieldCheck
                  size={17}
                  className="text-emerald-600"
                />
                When in doubt, share less.
              </div>

            </div>

            {/* Vault */}

            <div className="relative">

              <div className="absolute -inset-12 rounded-[3rem] bg-red-50 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-red-200 bg-white/95 shadow-[0_30px_120px_rgba(0,0,0,.4)]">

                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                  <div className="flex items-center gap-3">

                    <div className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,.7)]" />

                    <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-500">
                      Sensitive information
                    </span>

                  </div>

                  <Lock
                    size={14}
                    className="text-red-600/60"
                  />

                </div>

                <div className="p-6">

                  {privacyItems.map((item, index) => (

                    <div
                      key={item}
                      className="group flex items-center justify-between border-b border-slate-200 py-5 last:border-0"
                    >

                      <div className="flex items-center gap-4">

                        <span className="font-mono text-[9px] text-slate-700">
                          0{index + 1}
                        </span>

                        <span className="text-sm text-slate-600 transition-colors group-hover:text-navy-900">
                          {item}
                        </span>

                      </div>

                      <XCircle
                        size={15}
                        className="text-red-600/50"
                      />

                    </div>

                  ))}

                </div>

                <div className="border-t border-red-200 bg-red-50 px-6 py-5">

                  <div className="flex items-start gap-3">

                    <AlertTriangle
                      size={15}
                      className="mt-0.5 shrink-0 text-red-600"
                    />

                    <span className="text-xs leading-5 text-red-600/70">
                      Legitimate recovery should never require your
                      passwords, OTPs, or banking credentials.
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =======================================================
            SECTION 005 — VERIFY OWNERSHIP
        ======================================================== */}

        <section className="relative border-t border-slate-200 py-32 sm:py-40">

          <div className="grid gap-20 lg:grid-cols-[.75fr_1.25fr]">

            <div>

              <div className="flex items-center gap-3">

                <UserCheck
                  size={17}
                  className="text-blue-600"
                />

                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-blue-600">
                  005 / Verify ownership
                </span>

              </div>

              <h2 className="mt-6 font-display text-5xl font-semibold leading-[.95] tracking-[-0.055em] sm:text-6xl">

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

            <div className="space-y-3">

              {verificationSteps.map((item) => {

                const Icon = item.icon;

                return (
                  <div
                    key={item.number}
                    className="group relative overflow-hidden border-y border-slate-200 py-8 transition-colors duration-500 hover:bg-slate-50 sm:px-6"
                  >

                    <div className="flex gap-6">

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50">

                        <Icon
                          size={18}
                          className="text-blue-600"
                        />

                      </div>

                      <div className="flex-1">

                        <div className="flex flex-wrap items-center gap-3">

                          <span className="font-mono text-[9px] tracking-[0.2em] text-slate-700">
                            {item.number}
                          </span>

                          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-blue-600/60">
                            {item.label}
                          </span>

                        </div>

                        <h3 className="mt-2 text-xl font-semibold">
                          {item.title}
                        </h3>

                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                          {item.text}
                        </p>

                      </div>

                    </div>

                    <MoveRight
                      size={17}
                      className="absolute right-5 top-1/2 hidden -translate-y-1/2 text-blue-600/0 transition-all duration-500 group-hover:right-3 group-hover:text-blue-600/50 sm:block"
                    />

                  </div>
                );
              })}

            </div>

          </div>

        </section>

        {/* =======================================================
            SECTION 006 — RED FLAGS
        ======================================================== */}

        <section className="relative py-32 sm:py-40">

          <div className="mb-16 flex items-end justify-between">

            <div>

              <div className="flex items-center gap-3">

                <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,.5)]" />

                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-600">
                  006 / Threat detection
                </span>

              </div>

              <h2 className="mt-6 font-display text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">

                Know when to

                <span className="text-amber-600">
                  {" "}walk away.
                </span>

              </h2>

            </div>

            <span className="hidden font-mono text-[9px] tracking-[0.2em] text-slate-700 lg:block">
              SIGNAL_ANALYSIS / 006
            </span>

          </div>

          <div className="grid border-y border-slate-200 lg:grid-cols-2">

            {redFlags.map((item, index) => (

              <div
                key={item}
                className={`group relative overflow-hidden border-b border-slate-200 p-8 transition-all duration-500 hover:bg-amber-50 ${
                  index % 2 === 0
                    ? "lg:border-r"
                    : ""
                }`}
              >

                <div className="absolute left-0 top-0 h-full w-px bg-amber-400 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="flex gap-6">

                  <span className="font-mono text-[10px] text-amber-600/40">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="flex-1">

                    <div className="mb-5 flex items-center gap-2">

                      <span className="h-1 w-1 rounded-full bg-amber-400" />

                      <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-slate-700">
                        Warning signal
                      </span>

                    </div>

                    <p className="max-w-lg text-sm leading-7 text-slate-600 transition-colors duration-300 group-hover:text-slate-600">
                      {item}
                    </p>

                  </div>

                  <AlertTriangle
                    size={15}
                    className="text-amber-600/30 transition-colors group-hover:text-amber-600"
                  />

                </div>

              </div>

            ))}

          </div>

          <div className="mt-8 flex items-center gap-3 text-xs text-amber-600/70">
            <Radar size={15} />
            If something feels wrong, you are allowed to stop.
          </div>

        </section>

        {/* =======================================================
            SECTION 007 — CONTROL
        ======================================================== */}

        <section className="relative border-t border-slate-200 py-32 sm:py-40">

          <div className="relative mx-auto max-w-5xl text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 shadow-[0_0_60px_rgba(59,130,246,.06)]">

              <ShieldCheck
                size={27}
                className="text-blue-600"
              />

            </div>

            <span className="mt-7 block font-mono text-[9px] uppercase tracking-[0.3em] text-blue-600">
              You are in control
            </span>

            <h2 className="mt-6 font-display text-5xl font-semibold tracking-[-0.06em] sm:text-6xl lg:text-7xl">

              You can always

              <span className="text-emerald-600">
                {" "}say no.
              </span>

            </h2>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-500">
              You can pause a conversation, ask more questions, cancel a
              meetup, leave a situation, or report something that doesn&apos;t
              feel right.
            </p>

            <div className="mt-14 grid grid-cols-2 overflow-hidden rounded-[2rem] border border-slate-200 sm:grid-cols-4">

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
              ].map((item, index) => {

                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className={`group flex flex-col items-center justify-center py-10 transition-all duration-500 hover:bg-slate-50 ${
                      index !== 3
                        ? "border-r border-slate-200"
                        : ""
                    } ${
                      index < 2
                        ? "border-b sm:border-b-0"
                        : ""
                    }`}
                  >

                    <Icon
                      size={20}
                      className="text-blue-600 transition-transform duration-500 group-hover:-translate-y-1"
                    />

                    <span className="mt-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500 transition-colors group-hover:text-navy-900">
                      {item.label}
                    </span>

                  </div>
                );
              })}

            </div>

          </div>

        </section>

        {/* =======================================================
            REPORT
        ======================================================== */}

        <section className="border-y border-red-200 py-10 sm:py-12">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-red-50">

              <Flag
                size={19}
                className="text-red-600"
              />

            </div>

            <div className="flex-1">

              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-red-600">
                Help protect the community
              </span>

              <h2 className="mt-2 text-xl font-semibold">
                See something suspicious?
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Report scams, fake listings, harassment, impersonation,
                or other unsafe behavior through the available reporting
                tools.
              </p>

            </div>

            <button
              type="button"
              className="group flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-600 transition-colors hover:text-red-600"
            >

              Report suspicious activity

              <MoveRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />

            </button>

          </div>

        </section>

        {/* =======================================================
            EMERGENCY
        ======================================================== */}

        <section className="py-16 sm:py-20">

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200">

                <Phone
                  size={18}
                  className="text-slate-600"
                />

              </div>

              <div>

                <h2 className="font-semibold text-navy-900">
                  In immediate danger?
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
                  Prioritize your safety. Leave if possible and contact
                  appropriate local emergency services or authorities.
                  FindBack PH is not a replacement for emergency services.
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* =======================================================
            FINAL PRINCIPLE
        ======================================================== */}

        <section className="relative overflow-hidden py-32 text-center sm:py-48">

          {/* Atmosphere */}

          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[550px] w-[550px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-50 blur-[160px]" />

          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200" />

          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200" />

          <div className="relative mx-auto max-w-5xl">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 shadow-[0_0_80px_rgba(52,211,153,.06)]">

              <HeartHandshake
                size={32}
                strokeWidth={1.2}
                className="text-emerald-600"
              />

            </div>

            <div className="mt-8 flex items-center justify-center gap-2 font-mono text-[9px] uppercase tracking-[0.35em] text-emerald-600">

              <Sparkles size={13} />

              The FindBack principle

            </div>

            <h2 className="mt-8 font-display text-5xl font-semibold leading-[.92] tracking-[-0.065em] sm:text-6xl lg:text-[7rem]">

              The item can wait.

              <span className="block text-emerald-600">
                Your safety can&apos;t.
              </span>

            </h2>

            <p className="mx-auto mt-9 max-w-xl text-base leading-8 text-slate-500">
              If something doesn&apos;t feel right, you don&apos;t owe anyone a
              meetup, an explanation, or your personal information.
            </p>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">

              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">
                <ShieldCheck
                  size={15}
                  className="text-emerald-600"
                />
                Protect yourself
              </div>

              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">
                <Users
                  size={15}
                  className="text-blue-600"
                />
                Look out for others
              </div>

            </div>

            <div className="mt-14 flex items-center justify-center gap-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-700">

              <ShieldCheck
                size={14}
                className="text-emerald-600/70"
              />

              Safety is everyone&apos;s responsibility

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}