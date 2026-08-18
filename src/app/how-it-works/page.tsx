import Link from "next/link";
import {
  ClipboardList,
  Search,
  Sparkles,
  MessageCircle,
  MapPin,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Lock,
  Users,
  AlertTriangle,
  ChevronDown,
  Clock,
  Eye,
  BadgeCheck,
  HeartHandshake,
  Check,
  CircleDot,
  Star,
} from "lucide-react";

const journey = [
  { title: "Report", icon: ClipboardList },
  { title: "Search", icon: Search },
  { title: "Match", icon: Sparkles },
  { title: "Connect", icon: MessageCircle },
  { title: "Meet", icon: MapPin },
  { title: "Returned", icon: CheckCircle },
];

const steps = [
  {
    number: "01",
    title: "Report an item",
    description:
      "Create a detailed report with photos, location, date, category, and other important details to help identify your item.",
    icon: ClipboardList,
    label: "Start here",
  },
  {
    number: "02",
    title: "Search the community",
    description:
      "Explore lost and found reports using keywords, categories, locations, and filters to quickly narrow down possible matches.",
    icon: Search,
    label: "Explore",
  },
  {
    number: "03",
    title: "Find a possible match",
    description:
      "FindBack compares important details from reports to help identify items that may belong together.",
    icon: Sparkles,
    label: "Smart matching",
  },
  {
    number: "04",
    title: "Connect securely",
    description:
      "Use private in-app messaging to communicate with the other person without unnecessarily exposing personal information.",
    icon: MessageCircle,
    label: "Stay connected",
  },
  {
    number: "05",
    title: "Meet safely",
    description:
      "Verify the item first, then arrange a handover in a safe, public location.",
    icon: MapPin,
    label: "Stay safe",
  },
  {
    number: "06",
    title: "Item returned",
    description:
      "Mark the report as recovered and help close the loop. One more item safely back where it belongs.",
    icon: CheckCircle,
    label: "Success",
  },
];

const features = [
  {
    title: "Easy to Search",
    description:
      "Quickly explore lost and found reports using keywords, categories, locations, and filters.",
    icon: Search,
    number: "01",
  },
  {
    title: "Smart Matching",
    description:
      "FindBack helps identify possible connections between lost and found reports.",
    icon: Sparkles,
    number: "02",
  },
  {
    title: "Private Communication",
    description:
      "Connect through in-app messaging while keeping unnecessary personal information private.",
    icon: Lock,
    number: "03",
  },
  {
    title: "Safety First",
    description:
      "Follow simple safety recommendations when communicating and arranging item returns.",
    icon: ShieldCheck,
    number: "04",
  },
];

const safetyTips = [
  {
    title: "Meet in a public place",
    description:
      "Choose a busy and familiar location when arranging an item handover.",
    icon: MapPin,
  },
  {
    title: "Verify the item",
    description:
      "Ask for identifying details before handing over or claiming an item.",
    icon: BadgeCheck,
  },
  {
    title: "Protect your information",
    description:
      "Never share passwords, financial information, or unnecessary private details.",
    icon: ShieldCheck,
  },
  {
    title: "Keep messages on FindBack",
    description:
      "Use platform messaging whenever possible so important communication stays organized.",
    icon: MessageCircle,
  },
];

const faqs = [
  {
    question: "How does FindBack help match lost and found items?",
    answer:
      "FindBack uses information provided in reports such as item details, category, location, date, and descriptions to help identify possible connections.",
  },
  {
    question: "Is my personal information visible to everyone?",
    answer:
      "FindBack is designed to limit unnecessary exposure of personal information. Use in-app messaging and avoid sharing sensitive information with other users.",
  },
  {
    question: "What should I do if I find someone's item?",
    answer:
      "Create a found-item report with enough information for the owner to recognize it without revealing sensitive details.",
  },
  {
    question: "Where should I meet someone to return an item?",
    answer:
      "Choose a busy, familiar, public location. If possible, tell someone you trust about the meeting beforehand.",
  },
  {
    question: "What if I am not sure an item belongs to me?",
    answer:
      "Do not rely on appearance alone. Ask the person to verify specific identifying details before completing the handover.",
  },
];

const trustItems = [
  {
    icon: ShieldCheck,
    text: "Safety focused",
  },
  {
    icon: Lock,
    text: "Private messaging",
  },
  {
    icon: Users,
    text: "Community powered",
  },
  {
    icon: Sparkles,
    text: "Smart matching",
  },
];

const stats = [
  {
    icon: HeartHandshake,
    value: "6",
    label: "simple steps",
  },
  {
    icon: ShieldCheck,
    value: "100%",
    label: "safety focused",
  },
  {
    icon: Users,
    value: "1",
    label: "community",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="relative min-h-screen overflow-hidden py-16 text-navy-900 selection:bg-cyan-400/20 selection:text-navy-900 lg:py-24">
      {/* =========================================================
          BACKGROUND
      ========================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Main ambient glow */}
        <div className="absolute left-1/2 top-[-280px] h-[700px] w-[1100px] -translate-x-1/2 rounded-full bg-cyan-400/[0.055] blur-[160px]" />

        {/* Subtle atmosphere */}
        <div className="absolute left-[-250px] top-[25%] h-[500px] w-[500px] rounded-full bg-blue-500/[0.025] blur-[150px]" />

        <div className="absolute right-[-250px] top-[55%] h-[550px] w-[550px] rounded-full bg-cyan-500/[0.02] blur-[160px]" />

        {/* Very subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.5) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "linear-gradient(to bottom, black, transparent 75%)",
          }}
        />
      </div>

      {/* =========================================================
          MAIN CONTAINER
      ========================================================== */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* =========================================================
            HERO
        ========================================================== */}
        <section className="relative mx-auto max-w-5xl pt-4 text-center lg:pt-8">

          {/* Decorative left icon */}
          <div className="pointer-events-none absolute -left-4 top-20 hidden lg:block">
            <div className="flex h-14 w-14 rotate-[-8deg] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-cyan-700 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl">
              <Search size={21} strokeWidth={1.8} />
            </div>
          </div>

          {/* Decorative right icon */}
          <div className="pointer-events-none absolute -right-4 top-36 hidden lg:block">
            <div className="flex h-14 w-14 rotate-[8deg] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-emerald-700 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl">
              <CheckCircle size={21} strokeWidth={1.8} />
            </div>
          </div>

          {/* Eyebrow */}
          <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-700 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
            <Sparkles size={13} className="text-cyan-700" />
            A simpler way to reunite lost belongings
          </div>

          {/* Heading */}
          <h1 className="font-display text-[3.4rem] font-semibold leading-[0.98] tracking-[-0.045em] text-navy-900 sm:text-6xl lg:text-[6.5rem]">
            From lost
            <br />
            to{" "}
            <span className="bg-gradient-to-r from-cyan-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
              found.
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto mt-7 max-w-2xl text-[15px] leading-7 text-slate-700/80 sm:text-lg sm:leading-8">
            FindBack makes it easier to recover lost belongings and return
            found items to their rightful owners through one simple,
            community-powered process.
          </p>

          {/* CTA */}
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/search"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-cyan-300 to-cyan-400 px-6 py-3.5 text-sm font-semibold text-[#061019] shadow-[0_12px_35px_rgba(34,211,238,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(34,211,238,0.25)] active:translate-y-0"
            >
              Find a Lost Item
              <ArrowRight
                size={17}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>

            <Link
              href="/report/found"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-6 py-3.5 text-sm font-semibold text-navy-900 shadow-lg shadow-slate-900/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-100"
            >
              <ClipboardList size={17} className="text-cyan-700" />
              I Found Something
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 flex flex-wrap justify-center gap-2.5">
            {trustItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.text}
                  className="group flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600 backdrop-blur-xl transition-all duration-300 hover:border-slate-300 hover:bg-slate-100 hover:text-navy-900"
                >
                  <Icon
                    size={14}
                    strokeWidth={1.8}
                    className="text-cyan-700 transition-transform duration-300 group-hover:scale-110"
                  />
                  {item.text}
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================
            TRUST / STATS
        ========================================================== */}
        <section className="mx-auto mt-16 max-w-5xl lg:mt-20">
          <div className="grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 shadow-[0_20px_70px_rgba(0,0,0,0.15)] backdrop-blur-xl sm:grid-cols-3">
            {stats.map((stat, index) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className={`group flex items-center justify-center gap-4 px-6 py-6 ${
                    index !== 0
                      ? "border-t border-slate-200 sm:border-l sm:border-t-0"
                      : ""
                  }`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700">
                    <Icon size={19} strokeWidth={1.8} />
                  </div>

                  <div className="text-left">
                    <div className="font-display text-xl font-semibold text-navy-900">
                      {stat.value}
                    </div>

                    <div className="mt-0.5 text-xs text-slate-600">
                      {stat.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================
            JOURNEY
        ========================================================== */}
        <section className="mx-auto mt-24 max-w-6xl lg:mt-32">
          <div className="mb-10 text-center">
            <span className="text-xs font-semibold tracking-[0.18em] text-cyan-700/80">
              THE FINDBACK JOURNEY
            </span>

            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.025em] text-navy-900 sm:text-4xl">
              One simple path from lost to returned
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-slate-600">
              Every step is designed to make the recovery process easier,
              clearer, and safer.
            </p>
          </div>

          <div className="relative rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-9">
            {/* Connecting line */}
            <div className="absolute left-[8%] right-[8%] top-[68px] hidden h-px bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent lg:block" />

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6 lg:gap-3">
              {journey.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="group relative flex flex-col items-center text-center"
                  >
                    <div className="relative z-10">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-cyan-700 shadow-xl transition-all duration-300 group-hover:-translate-y-1 group-hover:border-cyan-300 group-hover:bg-cyan-50">
                        <Icon size={20} strokeWidth={1.8} />
                      </div>

                      <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border border-cyan-300 bg-cyan-300 px-1 text-[9px] font-bold text-[#061019]">
                        {index + 1}
                      </span>
                    </div>

                    <span className="mt-4 text-sm font-medium text-slate-700">
                      {item.title}
                    </span>

                    <span className="mt-1 text-[11px] text-slate-500">
                      Step {index + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================================
            SMART MATCHING
        ========================================================== */}
        <section className="mt-24 lg:mt-36">
          <div className="mb-10 text-center">
            <span className="text-xs font-semibold tracking-[0.18em] text-cyan-700/80">
              SMART MATCHING
            </span>

            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.025em] text-navy-900 sm:text-4xl lg:text-5xl">
              Watch a possible match come together
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-slate-600">
              FindBack compares useful report details to help people discover
              possible connections.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-cyan-400/[0.055] via-white/60 to-transparent p-5 shadow-[0_30px_100px_rgba(0,0,0,0.22)] sm:p-8 lg:p-10">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute left-1/2 top-[-120px] h-72 w-96 -translate-x-1/2 rounded-full bg-cyan-400/[0.055] blur-[100px]" />

            <div className="relative grid items-center gap-5 lg:grid-cols-[1fr_auto_1fr]">

              {/* Lost card */}
              <div className="group rounded-[1.5rem] border border-red-200 bg-white/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-1 hover:border-red-300">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700">
                    Lost report
                  </span>

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                    <Search
                      size={15}
                      strokeWidth={1.8}
                      className="text-red-700"
                    />
                  </div>
                </div>

                <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight text-navy-900">
                  Black Wallet
                </h3>

                <p className="mt-2 text-xs text-slate-500">
                  Report #FB-1024
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    [MapPin, "Malolos"],
                    [Clock, "August 15"],
                    [Eye, "Black leather"],
                  ].map(([Icon, text]) => {
                    const ItemIcon = Icon as typeof MapPin;

                    return (
                      <div
                        key={text as string}
                        className="flex items-center gap-3 text-sm text-slate-700/75"
                      >
                        <ItemIcon
                          size={15}
                          strokeWidth={1.8}
                          className="text-cyan-700/80"
                        />
                        {text as string}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Match center */}
              <div className="relative flex flex-col items-center justify-center">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-cyan-300/20 bg-cyan-50 text-cyan-700 shadow-[0_0_50px_rgba(34,211,238,0.12)]">
                  <div className="absolute inset-[-8px] rounded-[1.7rem] border border-cyan-200" />

                  <Sparkles size={27} strokeWidth={1.6} />

                  <div className="absolute inset-0 animate-ping rounded-[1.5rem] border border-cyan-200" />
                </div>

                <span className="mt-4 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-600">
                  Possible match
                </span>
              </div>

              {/* Found card */}
              <div className="group rounded-[1.5rem] border border-emerald-200 bg-white/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-1 hover:border-emerald-300">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                    Found report
                  </span>

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                    <CheckCircle
                      size={15}
                      strokeWidth={1.8}
                      className="text-emerald-700"
                    />
                  </div>
                </div>

                <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight text-navy-900">
                  Black Leather Wallet
                </h3>

                <p className="mt-2 text-xs text-slate-500">
                  Report #FB-1088
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    [MapPin, "Malolos"],
                    [CheckCircle, "Similar description"],
                    [MessageCircle, "Message securely"],
                  ].map(([Icon, text]) => {
                    const ItemIcon = Icon as typeof MapPin;

                    return (
                      <div
                        key={text as string}
                        className="flex items-center gap-3 text-sm text-slate-700/75"
                      >
                        <ItemIcon
                          size={15}
                          strokeWidth={1.8}
                          className={
                            text === "Similar description"
                              ? "text-emerald-700"
                              : "text-cyan-700/80"
                          }
                        />
                        {text as string}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Match score */}
            <div className="relative mx-auto mt-7 max-w-lg rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 sm:p-6">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CircleDot
                    size={14}
                    className="text-cyan-700"
                    strokeWidth={1.8}
                  />

                  <span className="font-medium text-slate-700">
                    Possible match
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    Match confidence
                  </div>

                  <div className="mt-0.5 font-display text-2xl font-semibold text-cyan-700">
                    92%
                  </div>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-600" />
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {[
                  "Category",
                  "Location",
                  "Color",
                  "Description",
                ].map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-600"
                  >
                    <Check size={11} className="text-emerald-700" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Flow */}
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-600">
              <span className="flex items-center gap-2">
                <MessageCircle
                  size={14}
                  className="text-cyan-700"
                  strokeWidth={1.8}
                />
                Verify details
              </span>

              <ArrowRight
                size={13}
                className="hidden text-slate-600 sm:block"
              />

              <span className="flex items-center gap-2">
                <MapPin
                  size={14}
                  className="text-cyan-700"
                  strokeWidth={1.8}
                />
                Meet safely
              </span>

              <ArrowRight
                size={13}
                className="hidden text-slate-600 sm:block"
              />

              <span className="flex items-center gap-2">
                <CheckCircle
                  size={14}
                  className="text-emerald-700"
                  strokeWidth={1.8}
                />
                Item returned
              </span>
            </div>

            <p className="relative mt-6 text-center text-[11px] leading-5 text-slate-500">
              Example only — actual matches depend on the information provided
              in reports.
            </p>
          </div>
        </section>

        {/* =========================================================
            SIX STEPS
        ========================================================== */}
        <section className="relative mx-auto mt-24 max-w-6xl lg:mt-36">
          <div className="mb-14 text-center">
            <span className="text-xs font-semibold tracking-[0.18em] text-cyan-700/80">
              HOW IT WORKS
            </span>

            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.025em] text-navy-900 sm:text-4xl lg:text-5xl">
              Six simple steps
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-slate-600">
              From the moment you report an item to the moment it finds its
              way home.
            </p>
          </div>

          {/* Timeline */}
          <div className="absolute bottom-20 left-[25px] top-44 hidden w-px bg-gradient-to-b from-cyan-300 via-cyan-200 to-transparent md:block lg:left-1/2 lg:-translate-x-1/2" />

          <div className="space-y-6 md:space-y-10 lg:space-y-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isLeft = index % 2 === 0;

              return (
                <div
                  key={step.number}
                  className="group relative md:grid md:grid-cols-[1fr_60px_1fr] md:items-center"
                >
                  {/* Card */}
                  <div
                    className={
                      isLeft
                        ? "md:col-start-1 md:row-start-1"
                        : "md:col-start-3 md:row-start-1"
                    }
                  >
                    <div
                      className={`relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-slate-300 hover:bg-slate-100 hover:shadow-[0_25px_80px_rgba(0,0,0,0.22)] sm:p-7 ${
                        !isLeft ? "md:text-left" : "md:text-right"
                      }`}
                    >
                      {/* Soft decorative glow */}
                      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-cyan-50/60 blur-3xl transition-all duration-500 group-hover:bg-cyan-300/[0.055]" />

                      <div
                        className={`relative flex items-start gap-4 ${
                          isLeft ? "md:flex-row-reverse" : ""
                        }`}
                      >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-700 transition-all duration-300 group-hover:scale-105 group-hover:border-cyan-300/[0.18]">
                          <Icon size={23} strokeWidth={1.7} />
                        </div>

                        <div className="flex-1">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-700/75">
                            {step.label}
                          </span>

                          <h3 className="mt-1.5 font-display text-xl font-semibold tracking-tight text-navy-900 sm:text-2xl">
                            {step.title}
                          </h3>
                        </div>

                        <span className="hidden font-display text-5xl font-semibold leading-none text-navy-900/[0.035] sm:block">
                          {step.number}
                        </span>
                      </div>

                      <p className="relative mt-5 text-[15px] leading-7 text-slate-700/75 sm:text-base">
                        {step.description}
                      </p>

                      <div
                        className={`relative mt-6 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-slate-500 ${
                          isLeft ? "md:justify-end" : ""
                        }`}
                      >
                        <span>
                          Step {index + 1} of {steps.length}
                        </span>

                        <span className="h-px w-7 bg-slate-200" />

                        <span className="text-cyan-700/60">
                          FindBack
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center node */}
                  <div className="absolute left-0 top-8 hidden md:relative md:col-start-2 md:row-start-1 md:flex md:justify-center">
                    <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-cyan-300/[0.12] bg-white shadow-[0_0_35px_rgba(34,211,238,0.08)]">
                      <div className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.6)] transition-transform duration-300 group-hover:scale-150" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================
            FEATURES
        ========================================================== */}
        <section className="mt-24 lg:mt-36">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold tracking-[0.18em] text-cyan-700/80">
              WHY FINDBACK?
            </span>

            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.025em] text-navy-900 sm:text-4xl lg:text-5xl">
              Built around real people
            </h2>

            <p className="mt-4 text-[15px] leading-7 text-slate-600">
              The tools you need to find, communicate, verify, and safely
              return lost belongings.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.14)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-slate-300 hover:bg-slate-100 hover:shadow-[0_25px_80px_rgba(0,0,0,0.2)]"
                >
                  <span className="absolute right-5 top-5 font-display text-4xl font-semibold text-navy-900/[0.035]">
                    {feature.number}
                  </span>

                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-700 transition-all duration-300 group-hover:scale-105 group-hover:bg-cyan-300/[0.08]">
                    <Icon size={21} strokeWidth={1.7} />
                  </div>

                  <h3 className="relative mt-6 font-display text-lg font-semibold tracking-tight text-navy-900">
                    {feature.title}
                  </h3>

                  <p className="relative mt-2 text-[15px] leading-6 text-slate-700/70">
                    {feature.description}
                  </p>

                  <div className="mt-7 h-px w-10 bg-cyan-300/20 transition-all duration-300 group-hover:w-16 group-hover:bg-cyan-300/40" />
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================
            SAFETY
        ========================================================== */}
        <section className="mt-24 lg:mt-36">
          <div className="relative overflow-hidden rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-white/60 to-transparent p-6 shadow-[0_30px_90px_rgba(0,0,0,0.2)] sm:p-9 lg:p-10">
            <div className="pointer-events-none absolute right-[-100px] top-[-100px] h-72 w-72 rounded-full bg-amber-100/40 blur-[110px]" />

            <div className="relative grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
                  <ShieldCheck size={25} strokeWidth={1.7} />
                </div>

                <span className="mt-6 block text-xs font-semibold tracking-[0.18em] text-amber-700/80">
                  SAFETY FIRST
                </span>

                <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.025em] text-navy-900 sm:text-4xl">
                  Keep every handover safe.
                </h2>

                <p className="mt-4 max-w-md text-[15px] leading-7 text-slate-700/75">
                  Finding an item is important, but your safety comes first.
                  Follow these simple guidelines before completing a return.
                </p>

                <div className="mt-6 flex items-center gap-2 text-sm text-slate-600">
                  <Star
                    size={14}
                    strokeWidth={1.8}
                    className="text-amber-700"
                  />
                  Your safety matters more than any item.
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {safetyTips.map((tip) => {
                  const Icon = tip.icon;

                  return (
                    <div
                      key={tip.title}
                      className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300 hover:bg-slate-50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-300/[0.04] text-cyan-700">
                          <Icon size={17} strokeWidth={1.7} />
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-navy-900">
                            {tip.title}
                          </h3>

                          <p className="mt-1.5 text-[13px] leading-5 text-slate-700/65">
                            {tip.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative mt-7 flex items-start gap-2 border-t border-slate-200 pt-5 text-[13px] leading-6 text-slate-600 sm:items-center">
              <AlertTriangle
                size={14}
                className="mt-1 shrink-0 text-amber-700 sm:mt-0"
              />

              <span>
                Never share passwords, financial information, or other
                sensitive information with another user.
              </span>
            </div>
          </div>
        </section>

        {/* =========================================================
            FAQ
        ========================================================== */}
        <section className="mx-auto mt-24 max-w-4xl lg:mt-36">
          <div className="text-center">
            <span className="text-xs font-semibold tracking-[0.18em] text-cyan-700/80">
              QUESTIONS?
            </span>

            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.025em] text-navy-900 sm:text-4xl lg:text-5xl">
              Everything you need to know
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-slate-600">
              A few answers to common questions before you get started.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {faqs.map((faq, index) => (
              <details
                key={faq.question}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-[0_10px_40px_rgba(0,0,0,0.1)] transition-all duration-300 open:border-cyan-300 open:bg-cyan-50/60 hover:border-slate-300"
              >
                <summary className="flex cursor-pointer list-none items-center gap-4 p-5 text-[15px] font-semibold leading-6 text-navy-900 sm:p-6">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cyan-200 bg-cyan-50 text-[10px] font-semibold text-cyan-700">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="flex-1">{faq.question}</span>

                  <ChevronDown
                    size={18}
                    strokeWidth={1.8}
                    className="shrink-0 text-slate-500 transition-transform duration-300 group-open:rotate-180 group-open:text-cyan-700"
                  />
                </summary>

                <div className="border-t border-slate-200 px-5 pb-6 pt-4 pl-16 text-[15px] leading-7 text-slate-700/70 sm:px-6 sm:pl-[4.5rem]">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* =========================================================
            FINAL CTA
        ========================================================== */}
        <section className="relative mt-24 overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-cyan-400/[0.07] via-white/70 to-transparent p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,0.25)] sm:p-12 lg:mt-36 lg:p-16">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute left-1/2 top-[-120px] h-72 w-[500px] -translate-x-1/2 rounded-full bg-cyan-400/[0.055] blur-[110px]" />

          {/* Decorative corners */}
          <div className="pointer-events-none absolute left-6 top-6 h-16 w-16 rounded-tl-2xl border-l border-t border-cyan-200" />

          <div className="pointer-events-none absolute bottom-6 right-6 h-16 w-16 rounded-br-2xl border-b border-r border-cyan-200" />

          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-700 shadow-[0_0_40px_rgba(34,211,238,0.08)]">
              <HeartHandshake size={28} strokeWidth={1.7} />
            </div>

            <span className="mt-6 block text-xs font-semibold tracking-[0.18em] text-cyan-700/80">
              READY WHEN YOU ARE
            </span>

            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-navy-900 sm:text-4xl lg:text-5xl">
              Help something find its way home.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-slate-700/75 sm:text-base">
              Search community reports for something you&apos;ve lost, or report
              an item you&apos;ve found and help reunite it with its owner.
            </p>

            <div className="mt-9 grid gap-3 sm:mx-auto sm:max-w-xl sm:grid-cols-2">
              <Link
                href="/search"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-cyan-300 to-cyan-400 px-6 py-3.5 text-sm font-semibold text-[#061019] shadow-[0_12px_35px_rgba(34,211,238,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(34,211,238,0.25)]"
              >
                Search Reports

                <ArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/report/lost"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-6 py-3.5 text-sm font-semibold text-navy-900 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-100"
              >
                <ClipboardList size={17} className="text-cyan-700" />
                Report an Item
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================
            BOTTOM SAFETY NOTE
        ========================================================== */}
        <div className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <ShieldCheck
            size={14}
            strokeWidth={1.8}
            className="text-cyan-700/80"
          />

          Always prioritize your safety when meeting to return an item.
        </div>
      </div>
    </main>
  );
}
