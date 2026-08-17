import Link from "next/link";
import {
  Search,
  MapPin,
  ShieldCheck,
  Lock,
  Users,
  Sparkles,
  Fingerprint,
  MessageCircle,
  Handshake,
  Radar,
  BrainCircuit,
  LocateFixed,
  ClipboardList,
  EyeOff,
  Heart,
  ArrowRight,
  Smartphone,
  Wallet,
  CreditCard,
  KeyRound,
  ShoppingBag,
  Cpu,
  FileText,
  Package,
  Compass,
  RefreshCcw,
  BellRing,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createClient();
  const [{ count: lostCount }, { count: foundCount }, { count: recoveredCount }] = await Promise.all([
    supabase.from("lost_items").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("found_items").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("lost_items").select("*", { count: "exact", head: true }).eq("status", "recovered"),
  ]);

  const categories = [
    { label: "Phones", icon: Smartphone },
    { label: "Wallets", icon: Wallet },
    { label: "IDs", icon: CreditCard },
    { label: "Keys", icon: KeyRound },
    { label: "Bags", icon: ShoppingBag },
    { label: "Electronics", icon: Cpu },
    { label: "Documents", icon: FileText },
    { label: "Other", icon: Package },
  ];

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden pb-4 pt-14 lg:pt-20">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 top-6 h-96 w-96 rounded-full bg-electric-500/20 blur-3xl motion-safe:animate-glow-drift" />
          <div className="absolute right-[-4rem] top-48 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl motion-safe:animate-glow-drift [animation-delay:-9s]" />
          <div className="absolute bottom-8 left-1/3 h-72 w-72 rounded-full bg-electric-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_78%)]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-8">
            {/* -------- LEFT: copy -------- */}
            <div>
              <div
                className="animate-[fade-up_0.7s_cubic-bezier(0.16,1,0.3,1)_both]"
                style={{ animationDelay: "40ms" }}
              >
                <span className="eyebrow">
                  <Sparkles size={14} /> Community-powered · Philippines
                </span>
              </div>

              <h1
                className="mt-5 animate-[fade-up_0.7s_cubic-bezier(0.16,1,0.3,1)_both] font-display text-[2.65rem] font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4rem]"
                style={{ animationDelay: "140ms" }}
              >
                Lost something?
                <br />
                <span className="gradient-text">Let&apos;s bring it back.</span>
              </h1>

              <p
                className="mt-6 max-w-md animate-[fade-up_0.7s_cubic-bezier(0.16,1,0.3,1)_both] text-lg leading-relaxed text-ink-secondary"
                style={{ animationDelay: "240ms" }}
              >
                FindBack PH connects people who lost something with people who found it — safely,
                quickly, and locally.
              </p>

              <div
                className="mt-8 flex flex-wrap gap-3 animate-[fade-up_0.7s_cubic-bezier(0.16,1,0.3,1)_both]"
                style={{ animationDelay: "340ms" }}
              >
                <Link href="/report/lost" className="btn-primary !px-6 !py-3 text-sm">
                  I Lost Something <ArrowRight size={16} />
                </Link>
                <Link href="/report/found" className="btn-secondary !px-6 !py-3 text-sm">
                  I Found Something
                </Link>
              </div>

              {/* Premium search bar */}
              <form
                action="/search"
                className="mt-9 max-w-xl animate-[fade-up_0.7s_cubic-bezier(0.16,1,0.3,1)_both] rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 shadow-[0_18px_50px_-24px_rgba(2,6,23,0.9)] backdrop-blur-md transition-colors focus-within:border-electric-500/40 sm:flex sm:items-center sm:gap-1.5"
                style={{ animationDelay: "440ms" }}
              >
                <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5 focus-within:bg-white/[0.04]">
                  <Search size={16} className="shrink-0 text-electric-400" />
                  <input
                    name="q"
                    placeholder="What did you lose?"
                    className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5 focus-within:bg-white/[0.04]">
                  <MapPin size={16} className="shrink-0 text-electric-400" />
                  <input
                    name="city"
                    placeholder="Where?"
                    className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                <button type="submit" className="btn-primary w-full !px-5 !py-2.5 text-sm sm:w-auto">
                  Search
                </button>
              </form>

              <p
                className="mt-3 text-sm text-ink-muted animate-[fade-up_0.7s_cubic-bezier(0.16,1,0.3,1)_both]"
                style={{ animationDelay: "520ms" }}
              >
                Try{" "}
                <span className="text-slate-300">
                  “iPhone”, “black wallet”, “student ID”, or “AirPods”
                </span>
              </p>
            </div>

            {/* -------- RIGHT: product visual -------- */}
            <HeroVisual />
          </div>

          {/* -------- TRUST STRIP -------- */}
          <div className="mt-20 grid grid-cols-2 gap-6 border-t border-white/10 pt-10 sm:grid-cols-4">
            <TrustItem icon={Sparkles} title="Free to use" desc="For the community" />
            <TrustItem icon={Fingerprint} title="Private by default" desc="Sensitive details stay hidden" />
            <TrustItem icon={MessageCircle} title="Secure messaging" desc="Talk without rushing to share numbers" />
            <TrustItem icon={Users} title="Community powered" desc="People helping people" />
          </div>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section id="how-it-works" className="relative scroll-mt-24 py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">
                <Compass size={14} /> How it works
              </span>
              <h2 className="mt-5 font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.75rem]">
                From lost to found, <span className="gradient-text">without the stress.</span>
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-secondary">
                FindBack PH makes it easier to report, discover, connect, and safely return lost
                belongings.
              </p>
            </div>
          </Reveal>

          <div className="relative mt-16">
            {/* Connecting line (desktop) */}
            <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-electric-500/40 to-transparent lg:block" />
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              <StepCard
                index="01"
                icon={ClipboardList}
                title="Report it"
                desc="Tell the community what you lost or found — in just a few minutes."
                delay={0}
              />
              <StepCard
                index="02"
                icon={Radar}
                title="Find a match"
                desc="We help surface possible matches based on item details and location."
                delay={120}
              />
              <StepCard
                index="03"
                icon={Handshake}
                title="Connect safely"
                desc="Communicate privately and arrange a safe handover on your terms."
                delay={240}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- WHY FINDBACK PH ---------------- */}
      <section className="relative py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="max-w-2xl">
              <span className="eyebrow">
                <Sparkles size={14} /> Why FindBack PH
              </span>
              <h2 className="mt-5 font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.75rem]">
                Built for the moment you realize{" "}
                <span className="gradient-text">something is missing.</span>
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-secondary">
                Every feature is designed to help you report, search, match, and safely reconnect —
                without exposing sensitive information.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Reveal delay={0} className="sm:col-span-2">
              <FeatureCard
                icon={BrainCircuit}
                title="Smart matching"
                desc="Surface possible matches using item details, location, and timing — so the right report finds you, not the other way around."
                accent="blue"
                featured
              />
            </Reveal>
            <Reveal delay={80}>
              <FeatureCard
                icon={Fingerprint}
                title="Privacy first"
                desc="Keep sensitive contact details private until both sides agree to connect."
                accent="violet"
              />
            </Reveal>
            <Reveal delay={0}>
              <FeatureCard
                icon={LocateFixed}
                title="Local by design"
                desc="Find lost and found items within your own community and neighborhood."
                accent="cyan"
              />
            </Reveal>
            <Reveal delay={80}>
              <FeatureCard
                icon={ShieldCheck}
                title="Safer handovers"
                desc="Encourage secure communication and practical handover arrangements."
                accent="emerald"
              />
            </Reveal>
            <Reveal delay={160}>
              <FeatureCard
                icon={Users}
                title="Community powered"
                desc="Turn good intentions into real-world returns, one neighbor at a time."
                accent="amber"
              />
            </Reveal>
            <Reveal delay={240}>
              <FeatureCard
                icon={ClipboardList}
                title="Simple reporting"
                desc="Create a lost or found report in minutes — no complicated forms."
                accent="blue"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- SAFETY ---------------- */}
      <section id="safety" className="relative scroll-mt-24 overflow-hidden py-24 lg:py-28">
        <div className="pointer-events-none absolute right-[-6rem] top-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            {/* Left: copy + principles */}
            <Reveal>
              <div>
                <span className="eyebrow">
                  <ShieldCheck size={14} /> Safety
                </span>
                <h2 className="mt-5 font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.75rem]">
                  Designed around <span className="gradient-text">safer reunions.</span>
                </h2>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-secondary">
                  Your safety comes first. FindBack PH is designed to help people reconnect without
                  requiring them to immediately expose personal contact information.
                </p>

                <div className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  <SafetyPoint icon={Lock} text="Private contact details" />
                  <SafetyPoint icon={MessageCircle} text="Secure communication" />
                  <SafetyPoint icon={EyeOff} text="No unnecessary personal info" />
                  <SafetyPoint icon={MapPin} text="Public-place handover guidance" />
                  <SafetyPoint icon={Users} text="Community reporting" />
                  <SafetyPoint icon={BellRing} text="Clear safety reminders" />
                </div>
              </div>
            </Reveal>

            {/* Right: shield visual */}
            <Reveal delay={120}>
              <div className="relative mx-auto w-full max-w-md">
                <div className="absolute left-1/2 top-1/2 h-[110%] w-[110%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/15 blur-3xl" />

                <div className="card relative z-10 flex flex-col items-center px-8 py-12 text-center shadow-card">
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/25 to-navy-800 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
                    <ShieldCheck size={44} className="text-emerald-300" />
                  </div>
                  <h3 className="mt-6 font-display text-xl font-semibold text-white">
                    Safer by design
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-400">
                    You choose how and when to share. Reconnect with confidence, on your terms.
                  </p>
                  <div className="mt-6 w-full space-y-2.5 border-t border-white/10 pt-6 text-left">
                    {[
                      "No phone numbers shown by default",
                      "In-app messaging keeps things private",
                      "Public-place meetup guidance",
                    ].map((line) => (
                      <div key={line} className="flex items-center gap-2.5 text-sm text-slate-300">
                        <CheckDot /> {line}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute -left-3 -top-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-[#0e1526]/90 px-3 py-2 shadow-card backdrop-blur-xl">
                  <Lock size={13} className="text-emerald-300" />
                  <span className="text-xs font-medium text-white">Private by default</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- IMPACT / COMMUNITY ---------------- */}
      <section id="impact" className="relative scroll-mt-24 overflow-hidden py-24 lg:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-electric-500/15 blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <span className="eyebrow">
              <Heart size={14} /> Our community
            </span>
            <h2 className="mt-6 font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.75rem]">
              Sometimes, it&apos;s more than <span className="gradient-text">just an item.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-secondary">
              A lost phone can contain years of memories. A wallet can hold someone&apos;s
              livelihood. An ID can be the key to getting through tomorrow. FindBack PH helps turn a
              stressful loss into a chance for someone to help.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="mx-auto mt-10 flex max-w-xl items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 shadow-card backdrop-blur-sm">
              <Heart size={26} className="shrink-0 text-white" />
              <p className="font-display text-xl font-semibold text-white sm:text-2xl">
                Help someone find their way back.
              </p>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/found" className="btn-primary !px-6 !py-3 text-sm">
                Search Lost Items <ArrowRight size={16} />
              </Link>
              <Link href="/report/found" className="btn-secondary !px-6 !py-3 text-sm">
                Report Something Found
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- STATISTICS ---------------- */}
      <section className="relative py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-navy-900/80 via-navy-800/60 to-navy-900/40 p-8 shadow-card sm:p-10">
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-electric-500/15 blur-3xl" />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">
                    The community in numbers
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Real counts pulled live from FindBack PH reports.
                  </p>
                </div>
                <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 sm:inline-flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse-soft" />
                  Live data
                </span>
              </div>

              <div className="mt-8 grid gap-8 border-t border-white/10 pt-8 sm:grid-cols-3">
                <Stat number={lostCount ?? 0} label="Lost reports" />
                <Stat number={foundCount ?? 0} label="Found reports" />
                <Stat number={recoveredCount ?? 0} label="Items recovered" accent />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- SEARCH EXPERIENCE ---------------- */}
      <section id="search" className="relative scroll-mt-24 py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">
                <Search size={14} /> Search
              </span>
              <h2 className="mt-5 font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.75rem]">
                Looking for <span className="gradient-text">something?</span>
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-secondary">
                Search reports by item, location, category, or date — find what belongs to you.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <form
              action="/search"
              className="mx-auto mt-12 max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-2.5 shadow-card backdrop-blur-md transition-colors focus-within:border-electric-500/40 sm:p-3"
            >
              <div className="grid gap-2.5 md:grid-cols-[1.6fr_1fr_1fr_auto]">
                <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-navy-900/60 px-4 py-3.5 focus-within:border-electric-400/60">
                  <Search size={18} className="shrink-0 text-electric-400" />
                  <input
                    name="q"
                    placeholder="Item — “wallet”, “iPhone”…"
                    className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-navy-900/60 px-4 py-3.5 focus-within:border-electric-400/60">
                  <MapPin size={18} className="shrink-0 text-electric-400" />
                  <input
                    name="city"
                    placeholder="Location"
                    className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-navy-900/60 px-4 py-3.5 focus-within:border-electric-400/60">
                  <Package size={18} className="shrink-0 text-electric-400" />
                  <select
                    name="category"
                    defaultValue=""
                    className="w-full cursor-pointer bg-transparent text-sm text-slate-300 focus:outline-none [&>option]:bg-navy-900"
                  >
                    <option value="">All categories</option>
                    {categories.map((c) => (
                      <option key={c.label} value={c.label.toLowerCase()}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-primary !px-6 !py-3.5 text-sm">
                  Search
                </button>
              </div>
            </form>
          </Reveal>

          {/* Category chips */}
          <Reveal delay={180}>
            <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-2.5">
              <span className="mr-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                Browse
              </span>
              {categories.map((c) => (
                <Link
                  key={c.label}
                  href={`/search?category=${c.label.toLowerCase()}`}
                  className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:border-electric-500/40 hover:bg-electric-500/10 hover:text-white"
                >
                  <c.icon size={15} className="text-electric-400" />
                  {c.label}
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="relative overflow-hidden px-4 pb-24 pt-10 sm:px-6 lg:pb-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[30rem] w-[52rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-electric-500/20 blur-[110px] motion-safe:animate-glow-drift" />
          <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        </div>

        <Reveal>
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-navy-800/80 via-navy-900/80 to-[#070b17]/90 p-10 text-center shadow-card sm:p-14">
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-electric-500/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-indigo-500/20 blur-3xl" />

            <RefreshCcw size={30} className="mx-auto text-electric-300" />
            <h2 className="mt-6 font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.75rem]">
              Lost something? <span className="gradient-text">Don&apos;t give up yet.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-ink-secondary">
              Someone may have found it. Start searching the FindBack PH community.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/search" className="btn-primary w-full !px-7 !py-3.5 text-sm sm:w-auto">
                Search Lost Items <ArrowRight size={16} />
              </Link>
              <Link href="/report/found" className="btn-secondary w-full !px-7 !py-3.5 text-sm sm:w-auto">
                Report Something Found
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
/* ---------------- Hero product visual ---------------- */
function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      {/* Ambient glow behind the card */}
      <div className="absolute left-1/2 top-1/2 h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] bg-electric-500/15 blur-3xl" />

      {/* Floating "New possible match" notification */}
      <div
        className="absolute -left-2 top-4 z-20 flex items-center gap-3 rounded-xl border border-white/10 bg-[#0e1526]/90 p-3 shadow-card backdrop-blur-xl motion-safe:animate-float"
        style={{ animationDelay: "-2s" }}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-electric-500/15 text-electric-300">
          <BellRing size={17} />
        </span>
        <div>
          <p className="text-xs font-semibold text-white">New possible match</p>
          <p className="text-[11px] text-slate-400">Your item may have been found</p>
        </div>
      </div>

      {/* Main found-item card */}
      <div
        className="card relative z-10 overflow-hidden p-5 shadow-card motion-safe:animate-float [animation-duration:8s]"
        style={{ animationDelay: "-1s" }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-electric-500/20 blur-2xl" />
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 rounded-full bg-electric-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-electric-300">
            <Radar size={13} /> Found item
          </span>
          <span className="text-xs text-slate-500">2h ago</span>
        </div>

        {/* Phone visual */}
        <div className="relative mt-4 flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-navy-800 via-navy-900 to-[#070b17]">
          <div className="absolute inset-0 bg-grid opacity-40" />
          <div className="absolute left-1/2 top-1/2 h-24 w-16 -translate-x-1/2 -translate-y-1/2 rotate-[-8deg] rounded-2xl border border-slate-600 bg-gradient-to-b from-slate-800 to-black p-1.5 shadow-2xl">
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-electric-500/50 to-navy-900">
              <span className="h-1 w-6 rounded-full bg-white/40" />
              <span className="text-[6px] font-semibold text-white">iPhone 15</span>
            </div>
          </div>
          <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-[10px] text-slate-200 backdrop-blur-sm">
            <MapPin size={10} className="text-electric-300" /> Pasay City
          </span>
        </div>

        <div className="mt-4">
          <h3 className="font-display text-lg font-semibold text-white">Black iPhone 15 Pro</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            Found near a mall information desk. The finder is willing to arrange a safe handover.
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          <ShieldCheck size={16} className="shrink-0 text-emerald-300" />
          <span>
            <span className="font-medium text-emerald-100">Safer handover.</span> Contact details
            stay private until you both agree to connect.
          </span>
        </div>
      </div>

      {/* Floating "Safer handover" pill */}
      <div
        className="absolute -right-2 top-24 z-20 flex items-center gap-2 rounded-full border border-emerald-500/30 bg-[#0e1526]/90 px-3 py-2 shadow-card backdrop-blur-xl motion-safe:animate-float"
        style={{ animationDelay: "-4s", animationDuration: "9s" }}
      >
        <Lock size={14} className="text-emerald-300" />
        <span className="text-xs font-medium text-white">Safer handover</span>
      </div>

      {/* Floating "Possible match" badge */}
      <div className="absolute -bottom-4 left-6 z-20 flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#0e1526]/90 px-3.5 py-2.5 shadow-card backdrop-blur-xl">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-electric-400 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-electric-400" />
        </span>
        <span className="text-xs font-medium text-white">
          Possible match <span className="font-semibold text-electric-300">92%</span>
        </span>
      </div>
    </div>
  );
}

/* ---------------- Trust item ---------------- */
function TrustItem({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-electric-500/20 bg-electric-500/10 text-electric-300 shadow-ring">
        <Icon size={20} />
      </span>
      <div>
        <p className="font-medium text-white">{title}</p>
        <p className="mt-0.5 text-sm leading-snug text-slate-400">{desc}</p>
      </div>
    </div>
  );
}

/* ---------------- How-it-works step card ---------------- */
function StepCard({
  index,
  icon: Icon,
  title,
  desc,
  delay,
}: {
  index: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <Reveal delay={delay}>
      <div className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-navy-800/60 to-navy-900/40 p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-electric-500/30">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-electric-500/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
        <div className="flex items-center justify-between">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-electric-500/20 bg-electric-500/10 text-electric-300 shadow-ring">
            <Icon size={22} />
          </span>
          <span className="font-display text-4xl font-bold text-white/10 transition-colors duration-300 group-hover:text-electric-500/30">
            {index}
          </span>
        </div>
        <h3 className="mt-5 font-display text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
      </div>
    </Reveal>
  );
}

/* ---------------- Why-feature card ---------------- */
const FEATURE_ACCENTS: Record<string, { chip: string; glow: string }> = {
  blue: {
    chip: "border-electric-500/25 bg-electric-500/10 text-electric-300",
    glow: "bg-electric-500/20",
  },
  violet: {
    chip: "border-violet-500/25 bg-violet-500/10 text-violet-300",
    glow: "bg-violet-500/20",
  },
  cyan: {
    chip: "border-cyan-500/25 bg-cyan-500/10 text-cyan-300",
    glow: "bg-cyan-500/20",
  },
  emerald: {
    chip: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    glow: "bg-emerald-500/20",
  },
  amber: {
    chip: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    glow: "bg-amber-500/20",
  },
};

function FeatureCard({
  icon: Icon,
  title,
  desc,
  accent,
  featured = false,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  accent: keyof typeof FEATURE_ACCENTS;
  featured?: boolean;
}) {
  const a = FEATURE_ACCENTS[accent];
  return (
    <div
      className={`group relative h-full overflow-hidden rounded-2xl border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 ${
        featured
          ? "bg-gradient-to-br from-navy-800/80 via-navy-900/70 to-navy-900/40 p-8 shadow-card lg:flex lg:items-center lg:gap-8"
          : "bg-navy-900/40 p-7 shadow-card hover:shadow-glow"
      }`}
    >
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl opacity-60 transition-opacity duration-300 group-hover:opacity-100 ${a.glow}`}
      />
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-ring ${a.chip}`}
      >
        <Icon size={22} />
      </span>
      <div className="mt-5 lg:mt-0">
        <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">{desc}</p>
      </div>
    </div>
  );
}

/* ---------------- Safety point ---------------- */
function SafetyPoint({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 shadow-ring">
        <Icon size={17} />
      </span>
      <span className="text-sm font-medium text-slate-200">{text}</span>
    </div>
  );
}

/* ---------------- Check dot ---------------- */
function CheckDot() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

/* ---------------- Stat ---------------- */
function Stat({ number, label, accent = false }: { number: number; label: string; accent?: boolean }) {
  return (
    <div>
      <div
        className={`font-display text-4xl font-bold tabular-nums sm:text-5xl ${
          accent ? "gradient-text" : "text-white"
        }`}
      >
        {number.toLocaleString()}
      </div>
      <div className="mt-1.5 text-sm text-slate-400">{label}</div>
    </div>
  );
}


