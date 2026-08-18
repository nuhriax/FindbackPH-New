import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Globe2,
  HandHeart,
  Fingerprint,
  Plus,
} from "lucide-react";

// =============================================================
// TYPES
// =============================================================

interface NumberedItem {
  icon: LucideIcon;
  number: string;
  title: string;
  description: string;
}

interface Step {
  icon: LucideIcon;
  number: string;
  title: string;
  description: string;
}

interface Benefit {
  icon: LucideIcon;
  number: string;
  title: string;
  text: string;
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
    text: "Search reports from people who have lost or found belongings around their communities.",
  },
  {
    icon: ShieldCheck,
    number: "02",
    title: "Connect safely",
    text: "Communicate with others without unnecessarily exposing your personal contact information.",
  },
  {
    icon: HeartHandshake,
    number: "03",
    title: "Give it back",
    text: "Turn a simple discovery into a safe and meaningful return to its rightful owner.",
  },
];

const steps: Step[] = [
  {
    number: "01",
    icon: Search,
    title: "Search",
    description:
      "Look through existing lost and found reports to see if someone's report matches what you're looking for.",
  },
  {
    number: "02",
    icon: MessageCircle,
    title: "Connect",
    description:
      "When you find a possible match, communicate with the other person through a safer, more private experience.",
  },
  {
    number: "03",
    icon: HeartHandshake,
    title: "Reconnect",
    description:
      "Work together to verify the item and arrange a safe return to the person it belongs to.",
  },
];

const values: NumberedItem[] = [
  {
    icon: Users,
    number: "01",
    title: "Community powered",
    description:
      "Every report gives someone another opportunity to recover something important.",
  },
  {
    icon: LockKeyhole,
    number: "02",
    title: "Privacy conscious",
    description:
      "Helping someone should not require giving away more personal information than necessary.",
  },
  {
    icon: HeartHandshake,
    number: "03",
    title: "Built on kindness",
    description:
      "A simple act of returning something can make a meaningful difference in someone's day.",
  },
];

const storyChecklist = [
  "Make reports easier to discover",
  "Encourage responsible communication",
  "Reduce unnecessary friction",
  "Help communities reconnect",
];

const missionValues = ["Community", "Trust", "Safety", "Kindness"];

const networkNodes: NetworkNode[] = [
  { x: "left-[16%]", y: "top-[28%]", label: "LUZON" },
  { x: "left-[42%]", y: "top-[43%]", label: "METRO MANILA" },
  { x: "right-[18%]", y: "top-[31%]", label: "COMMUNITY" },
  { x: "left-[34%]", y: "bottom-[22%]", label: "VISAYAS" },
  { x: "right-[23%]", y: "bottom-[25%]", label: "MINDANAO" },
];

// =============================================================
// SHARED UI
// =============================================================

function Eyebrow({
  children,
  index,
}: {
  children: React.ReactNode;
  index?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="h-px w-8 bg-sky-400 sm:w-10"
      />

      <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-sky-600">
        {children}
      </span>

      {index && (
        <span
          aria-hidden="true"
          className="text-[10px] text-slate-600"
        >
          / {index}
        </span>
      )}
    </div>
  );
}

function CTALink({
  href,
  variant = "primary",
  children,
  trailingIcon: TrailingIcon = ArrowRight,
}: {
  href: string;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
  trailingIcon?: LucideIcon;
}) {
  const base =
    "group inline-flex items-center justify-center gap-3 rounded-full px-7 py-3.5 text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:ring-offset-2 focus:ring-offset-white";

  const variantClass =
    variant === "primary"
      ? [
          "bg-sky-400 text-slate-950",
          "shadow-[0_12px_40px_rgba(56,189,248,0.18)]",
          "hover:-translate-y-0.5 hover:bg-sky-300",
          "hover:shadow-[0_18px_50px_rgba(56,189,248,0.28)]",
        ].join(" ")
      : [
          "border border-slate-300 text-navy-900",
          "hover:-translate-y-0.5 hover:border-sky-400/30",
          "hover:bg-slate-50",
        ].join(" ");

  return (
    <Link
      href={href}
      className={`${base} ${variantClass}`}
    >
      {children}

      <TrailingIcon
        aria-hidden="true"
        size={16}
        className="transition-transform duration-300 group-hover:translate-x-1"
      />
    </Link>
  );
}

// =============================================================
// PAGE
// =============================================================

export default function AboutPage() {
  return (
    <main className="relative overflow-hidden  text-navy-900 selection:bg-sky-400/20 selection:text-sky-950">
      {/* =========================================================
          BACKGROUND
      ========================================================= */}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-20 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-320px] h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-sky-400/[0.06] blur-[160px]" />

        <div className="absolute -left-[350px] top-[45%] h-[650px] w-[650px] rounded-full bg-sky-400/[0.018] blur-[160px]" />

        <div className="absolute -right-[350px] top-[72%] h-[650px] w-[650px] rounded-full bg-cyan-400/[0.015] blur-[160px]" />

        <div className="absolute inset-0 opacity-[0.025]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "linear-gradient(rgba(148,163,184,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.5) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,transparent_0%,rgba(241,245,249,.6)_72%)]" />
      </div>

      {/* =========================================================
          HERO
      ========================================================= */}

      <section className="relative px-5 pb-28 pt-24 sm:px-6 lg:pb-40 lg:pt-36">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            {/* LEFT */}
            <div>
              <Eyebrow index="001">About FindBack PH</Eyebrow>

              <h1 className="mt-8 max-w-5xl font-display text-[3.5rem] font-semibold leading-[0.92] tracking-[-0.055em] text-navy-900 sm:text-6xl lg:text-[6.8rem]">
                Lost things
                <span className="block text-navy-900/30">
                  have stories.
                </span>

                <span className="block bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
                  Help them continue.
                </span>
              </h1>

              <p className="mt-10 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl sm:leading-9">
                FindBack PH helps people across the Philippines reconnect
                with the belongings that matter to them — through a simpler,
                safer, community-powered way to find what was lost.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <CTALink href="/search">
                  Find an Item
                </CTALink>

                <CTALink
                  href="/report/lost"
                  variant="secondary"
                  trailingIcon={Plus}
                >
                  Report Something Lost
                </CTALink>
              </div>

              <div className="mt-12 flex items-center gap-3 text-sm text-slate-700">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.6)]" />

                <span>
                  Helping communities reconnect across the Philippines
                </span>
              </div>
            </div>

            {/* RIGHT VISUAL */}
            <div
              aria-hidden="true"
              className="relative hidden min-h-[500px] lg:block"
            >
              {/* Coordinates */}
              <div className="absolute right-0 top-0 text-right font-mono text-[9px] leading-5 tracking-[0.2em] text-slate-700">
                FIND
                <br />
                CONNECT
                <br />
                RETURN
              </div>

              {/* Rings */}
              <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-400/[0.06]" />

              <div className="absolute left-1/2 top-1/2 h-[310px] w-[310px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-400/[0.08]" />

              <div className="absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-400/[0.11]" />

              {/* Rotating line */}
              <div className="absolute left-1/2 top-1/2 h-[210px] w-px origin-bottom -translate-x-1/2 -translate-y-full bg-gradient-to-t from-sky-400/70 to-transparent motion-safe:animate-[spin_8s_linear_infinite]" />

              {/* Center */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="absolute -inset-12 rounded-full bg-sky-400/[0.08] blur-3xl motion-safe:animate-pulse" />

                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-sky-300/20 bg-sky-400/[0.07] shadow-[0_0_80px_rgba(56,189,248,0.16)]">
                  <HeartHandshake
                    size={34}
                    strokeWidth={1.5}
                    className="text-sky-600"
                  />
                </div>
              </div>

              {/* Decorative nodes */}
              <div className="absolute left-[10%] top-[32%]">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inset-0 rounded-full bg-sky-400/50 motion-safe:animate-ping" />
                    <span className="relative h-2 w-2 rounded-full bg-sky-400" />
                  </span>

                  <span className="text-[9px] font-medium tracking-[0.18em] text-slate-600">
                    LOST REPORT
                  </span>
                </div>
              </div>

              <div className="absolute right-[10%] top-[25%]">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inset-0 rounded-full bg-sky-400/50 motion-safe:animate-ping" />
                    <span className="relative h-2 w-2 rounded-full bg-sky-400" />
                  </span>

                  <span className="text-[9px] font-medium tracking-[0.18em] text-slate-600">
                    POSSIBLE MATCH
                  </span>
                </div>
              </div>

              <div className="absolute bottom-[22%] right-[12%]">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inset-0 rounded-full bg-emerald-400/50 motion-safe:animate-ping" />
                    <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
                  </span>

                  <span className="text-[9px] font-medium tracking-[0.18em] text-slate-600">
                    RETURN
                  </span>
                </div>
              </div>

              {/* Connecting lines */}
              <div className="absolute left-[15%] top-[37%] h-px w-[32%] rotate-[13deg] bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" />

              <div className="absolute right-[16%] top-[34%] h-px w-[28%] -rotate-[20deg] bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" />

              <div className="absolute bottom-[28%] left-[22%] h-px w-[52%] rotate-[25deg] bg-gradient-to-r from-transparent via-sky-400/20 to-transparent" />

              {/* Bottom label */}
              <div className="absolute bottom-2 left-0 max-w-[220px] border-l border-sky-400/20 pl-5">
                <p className="text-[9px] uppercase tracking-[0.22em] text-slate-600">
                  Built around people
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  One connection can be enough to bring something important
                  home.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          BENEFITS
      ========================================================= */}

      <section className="border-y border-slate-200">
        <div className="mx-auto grid max-w-7xl md:grid-cols-3">
          {benefits.map((item, index) => {
            const Icon = item.icon;

            return (
              <article
                key={item.number}
                className={[
                  "group p-8 transition-colors duration-500 hover:bg-slate-50 sm:p-10 lg:p-12",
                  index !== 0
                    ? "border-t border-slate-200 md:border-l md:border-t-0"
                    : "",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-wider text-sky-400">
                    {item.number}
                  </span>

                  <Icon
                    aria-hidden="true"
                    size={20}
                    strokeWidth={1.5}
                    className="text-slate-600 transition-colors duration-300 group-hover:text-sky-600"
                  />
                </div>

                <h3 className="mt-10 font-display text-2xl font-semibold tracking-[-0.02em] text-navy-900">
                  {item.title}
                </h3>

                <p className="mt-3 max-w-sm text-sm leading-7 text-slate-600">
                  {item.text}
                </p>

                <div className="mt-8 h-px w-8 bg-sky-400/30 transition-all duration-500 group-hover:w-16 group-hover:bg-sky-400/60" />
              </article>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          STORY
      ========================================================= */}

      <section className="relative px-5 py-32 sm:px-6 lg:py-44">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-[0.28fr_1fr]">
            {/* SIDE LABEL */}
            <aside className="hidden lg:block">
              <div className="sticky top-32">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_15px_rgba(56,189,248,.65)]" />

                  <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-slate-700">
                    Our story
                  </span>
                </div>

                <div className="mt-8 border-l border-slate-200 pl-5">
                  <p className="text-xs leading-6 text-slate-700">
                    WHY
                    <br />
                    FINDBACK
                    <br />
                    EXISTS
                  </p>
                </div>
              </div>
            </aside>

            <div>
              <Eyebrow>Why we exist</Eyebrow>

              <h2 className="mt-7 max-w-4xl font-display text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-navy-900 sm:text-5xl lg:text-6xl">
                Sometimes a small item carries a{" "}
                <span className="text-sky-400">
                  big story.
                </span>
              </h2>

              <div className="mt-16 grid gap-14 lg:grid-cols-[1fr_0.8fr]">
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

                  <p className="text-navy-900">
                    FindBack PH exists to make that first step easier.
                  </p>
                </div>

                <ul className="border-l border-slate-200 pl-7">
                  {storyChecklist.map((item, index) => (
                    <li
                      key={item}
                      className="group flex gap-4 border-b border-slate-200 py-5 first:pt-0 last:border-b-0"
                    >
                      <span className="font-mono text-[10px] text-sky-400">
                        0{index + 1}
                      </span>

                      <div className="flex items-start gap-3">
                        <CheckCircle2
                          aria-hidden="true"
                          size={16}
                          className="mt-1 shrink-0 text-sky-400 transition-transform duration-300 group-hover:scale-110"
                        />

                        <span className="text-sm leading-6 text-slate-700">
                          {item}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <blockquote className="relative mt-20 border-y border-sky-400/15 py-12 sm:py-14">
                <div
                  aria-hidden="true"
                  className="absolute left-0 top-0 h-px w-20 bg-sky-400"
                />

                <div className="flex gap-5">
                  <HeartHandshake
                    aria-hidden="true"
                    size={25}
                    strokeWidth={1.5}
                    className="mt-1 shrink-0 text-sky-600"
                  />

                  <p className="max-w-4xl font-display text-2xl font-medium leading-9 tracking-[-0.02em] text-navy-900 sm:text-3xl sm:leading-10">
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

      <section className="relative border-y border-slate-200 px-5 py-32 sm:px-6 lg:py-44">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-[0.4fr_1fr]">
            <div>
              <Eyebrow>The process</Eyebrow>

              <h2 className="mt-7 font-display text-4xl font-semibold leading-[0.95] tracking-[-0.045em] text-navy-900 sm:text-5xl lg:text-6xl">
                From lost
                <br />
                to found.
              </h2>

              <p className="mt-7 max-w-sm text-base leading-7 text-slate-600">
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
                      <span className="font-mono text-sm text-sky-400">
                        {step.number}
                      </span>
                    </div>

                    <div className="max-w-2xl">
                      <div className="flex items-center gap-4">
                        <Icon
                          aria-hidden="true"
                          size={20}
                          strokeWidth={1.5}
                          className="text-sky-400 transition-transform duration-300 group-hover:scale-110"
                        />

                        <h3 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-900 transition-colors duration-300 group-hover:text-sky-600 sm:text-3xl">
                          {step.title}
                        </h3>
                      </div>

                      <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
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

      <section className="px-5 py-32 sm:px-6 lg:py-48">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-5xl">
            <div className="flex items-center gap-3">
              <Sparkles
                aria-hidden="true"
                size={17}
                strokeWidth={1.5}
                className="text-sky-400"
              />

              <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-sky-400">
                Our mission
              </span>
            </div>

            <h2 className="mt-8 font-display text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-navy-900 sm:text-6xl lg:text-[6.5rem]">
              Make
              <span className="text-navy-900/30"> helping </span>
              each other
              <span className="text-sky-400"> easier.</span>
            </h2>

            <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_0.65fr]">
              <p className="max-w-3xl text-xl leading-9 text-slate-700">
                FindBack PH exists to make lost-and-found easier, safer,
                and more accessible for communities across the Philippines.
              </p>

              <div className="border-l border-slate-200 pl-6">
                <p className="text-sm leading-7 text-slate-600">
                  We believe technology should make good intentions easier
                  to act on — whether you&apos;re searching for something you&apos;ve
                  lost or trying to return something you&apos;ve found.
                </p>

                <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-3">
                  {missionValues.map((item) => (
                    <li key={item}>
                      <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-700 transition-colors hover:text-sky-600">
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

      <section className="border-y border-slate-200 px-5 py-32 sm:px-6 lg:py-40">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-14 lg:grid-cols-[0.42fr_1fr]">
            <div>
              <Eyebrow>What we believe</Eyebrow>

              <h2 className="mt-7 max-w-md font-display text-4xl font-semibold leading-[0.98] tracking-[-0.04em] text-navy-900 sm:text-5xl">
                People are at the center.
              </h2>

              <p className="mt-6 max-w-sm text-base leading-7 text-slate-700">
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
                      <span className="font-mono text-xs text-sky-400">
                        {value.number}
                      </span>

                      <div>
                        <div className="flex items-center gap-3">
                          <Icon
                            aria-hidden="true"
                            size={19}
                            strokeWidth={1.5}
                            className="text-slate-600 transition-colors duration-300 group-hover:text-sky-600"
                          />

                          <h3 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-900 transition-colors duration-300 group-hover:text-sky-600">
                            {value.title}
                          </h3>
                        </div>

                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                          {value.description}
                        </p>
                      </div>

                      <ArrowRight
                        aria-hidden="true"
                        size={18}
                        className="hidden text-slate-700 transition-all duration-300 group-hover:translate-x-1 group-hover:text-sky-600 sm:block"
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

      <section className="relative px-5 py-32 sm:px-6 lg:py-44">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            {/* VISUAL */}
            <div
              aria-hidden="true"
              className="relative min-h-[450px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-50"
            >
              {/* Grid */}
              <div className="absolute inset-0 opacity-[0.08]">
                <div
                  className="h-full w-full"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, rgba(56,189,248,.8) 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                  }}
                />
              </div>

              {/* Soft glow */}
              <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/[0.06] blur-3xl" />

              {/* Connection lines */}
              <div className="absolute left-[10%] top-[35%] h-px w-[75%] rotate-[12deg] bg-sky-400/15" />

              <div className="absolute left-[18%] top-[58%] h-px w-[68%] -rotate-[16deg] bg-sky-400/15" />

              <div className="absolute left-[48%] top-[10%] h-[80%] w-px rotate-[20deg] bg-sky-400/10" />

              {/* Nodes */}
              {networkNodes.map((node) => (
                <div
                  key={node.label}
                  className={`absolute ${node.x} ${node.y} group`}
                >
                  <div className="absolute -inset-4 rounded-full bg-sky-400/10 blur-xl transition-all duration-500 group-hover:bg-sky-400/20" />

                  <div className="relative h-3 w-3 rounded-full border border-sky-300/50 bg-sky-400 shadow-[0_0_20px_rgba(56,189,248,.5)]" />

                  <span className="absolute left-5 top-[-5px] whitespace-nowrap text-[8px] tracking-[0.16em] text-slate-600">
                    {node.label}
                  </span>
                </div>
              ))}

              {/* Globe */}
              <div className="absolute right-7 top-7">
                <Globe2
                  size={28}
                  strokeWidth={1}
                  className="text-sky-500/50"
                />
              </div>

              {/* Label */}
              <div className="absolute bottom-8 left-8 max-w-xs">
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-sky-400">
                  Built for the Philippines
                </p>

                <p className="mt-3 font-display text-2xl font-semibold leading-tight text-navy-900">
                  Local connections can create nationwide impact.
                </p>
              </div>
            </div>

            {/* CONTENT */}
            <div>
              <Eyebrow>Built for PH</Eyebrow>

              <h2 className="mt-7 font-display text-4xl font-semibold leading-[0.95] tracking-[-0.045em] text-navy-900 sm:text-5xl lg:text-6xl">
                One shared
                <br />
                <span className="text-sky-400">
                  community.
                </span>
              </h2>

              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
                FindBack PH is designed around the way real communities
                connect — reducing friction, encouraging responsible
                communication, and making it easier to return lost
                belongings.
              </p>

              <ul className="mt-10">
                <li className="group flex gap-5 border-t border-slate-200 py-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 transition-all duration-300 group-hover:border-sky-400/30 group-hover:bg-sky-50">
                    <MapPin
                      aria-hidden="true"
                      size={18}
                      strokeWidth={1.5}
                      className="text-slate-700 transition-colors group-hover:text-sky-600"
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-navy-900">
                      Made for local communities
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Connect lost and found reports with people in
                      communities across Luzon, Visayas, and Mindanao.
                    </p>
                  </div>
                </li>

                <li className="group flex gap-5 border-t border-slate-200 py-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 transition-all duration-300 group-hover:border-sky-400/30 group-hover:bg-sky-50">
                    <Fingerprint
                      aria-hidden="true"
                      size={18}
                      strokeWidth={1.5}
                      className="text-slate-700 transition-colors group-hover:text-sky-600"
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-navy-900">
                      Privacy conscious
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Helping someone should not require exposing more
                      personal information than necessary.
                    </p>
                  </div>
                </li>

                <li className="group flex gap-5 border-y border-slate-200 py-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 transition-all duration-300 group-hover:border-sky-400/30 group-hover:bg-sky-50">
                    <HeartHandshake
                      aria-hidden="true"
                      size={18}
                      strokeWidth={1.5}
                      className="text-slate-700 transition-colors group-hover:text-sky-600"
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-navy-900">
                      Built around kindness
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-700">
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
          FINAL CTA
      ========================================================= */}

      <section className="relative border-t border-slate-200 px-5 py-32 sm:px-6 lg:py-48">
        <div className="mx-auto max-w-5xl text-center">
          {/* Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-sky-400/20 bg-sky-400/[0.06] shadow-[0_0_50px_rgba(56,189,248,.08)]">
            <HeartHandshake
              size={27}
              strokeWidth={1.5}
              className="text-sky-600"
            />
          </div>

          <p className="mt-10 text-[11px] font-medium uppercase tracking-[0.25em] text-sky-400">
            Be part of the connection
          </p>

          <h2 className="mx-auto mt-6 max-w-4xl font-display text-5xl font-semibold leading-[0.95] tracking-[-0.05em] text-navy-900 sm:text-6xl lg:text-7xl">
            What you found
            <span className="block text-sky-400">
              might mean everything to someone.
            </span>
          </h2>

          <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Search existing reports, report something you&apos;ve lost, or help
            someone in your community get an important belonging back.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <CTALink href="/search">
              Search Reports
            </CTALink>

            <CTALink
              href="/report/lost"
              variant="secondary"
              trailingIcon={Plus}
            >
              Report an Item
            </CTALink>
          </div>

          {/* Trust badges */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-600">
              <ShieldCheck
                size={14}
                className="text-emerald-400"
              />
              Safety
            </div>

            <span className="h-1 w-1 rounded-full bg-slate-700" />

            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-600">
              <Fingerprint
                size={14}
                className="text-sky-400"
              />
              Privacy
            </div>

            <span className="h-1 w-1 rounded-full bg-slate-700" />

            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-600">
              <Users
                size={14}
                className="text-sky-400"
              />
              Community
            </div>

            <span className="h-1 w-1 rounded-full bg-slate-700" />

            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-600">
              <HandHeart
                size={14}
                className="text-sky-400"
              />
              Kindness
            </div>
          </div>

          {/* Footer line */}
          <div className="mt-16 border-t border-slate-200 pt-6">
            <div className="flex flex-col items-center justify-between gap-3 text-[9px] uppercase tracking-[0.22em] text-slate-700 sm:flex-row">
              <span>
                FINDBACK PH / COMMUNITY FIRST
              </span>

              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.5)]" />
                Helping people reconnect
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
