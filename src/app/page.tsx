import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Gem,
  HeartHandshake,
  KeyRound,
  MapPin,
  PackageSearch,
  PawPrint,
  Radar,
  Search,
  ShieldCheck,
  Shirt,
  Smartphone,
  Sparkles,
  Users,
  WalletCards,
  Zap,
  GraduationCap,
} from "lucide-react";

import { Reveal } from "@/components/reveal";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validation";

export default async function HomePage() {
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

  const activeLost = lostCount ?? 0;
  const activeFound = foundCount ?? 0;
  const recovered = recoveredCount ?? 0;

  const totalActive = activeLost + activeFound;
  const hasReports = totalActive > 0;

  /*
  |--------------------------------------------------------------------------
  | CATEGORY ICONS
  |--------------------------------------------------------------------------
  */

  const categoryIcons: Record<string, React.ReactNode> = {
    phones: <Smartphone size={20} />,
    wallets: <WalletCards size={20} />,
    ids: <BadgeCheck size={20} />,
    bags: <BriefcaseBusiness size={20} />,
    keys: <KeyRound size={20} />,
    jewelry: <Gem size={20} />,
    electronics: <Zap size={20} />,
    documents: <FileText size={20} />,
    clothing: <Shirt size={20} />,
    pets: <PawPrint size={20} />,
    school_items: <GraduationCap size={20} />,
  };

  /*
  |--------------------------------------------------------------------------
  | CATEGORY COLORS
  |--------------------------------------------------------------------------
  */

  const categoryStyles = [
    {
      bg: "bg-blue-50",
      text: "text-blue-600",
      hoverBg: "group-hover:bg-blue-600",
      hoverText: "group-hover:text-white",
      glow: "bg-blue-400/20",
      line: "group-hover:bg-blue-500",
      title: "group-hover:text-blue-600",
    },
    {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      hoverBg: "group-hover:bg-indigo-600",
      hoverText: "group-hover:text-white",
      glow: "bg-indigo-400/20",
      line: "group-hover:bg-indigo-500",
      title: "group-hover:text-indigo-600",
    },
    {
      bg: "bg-cyan-50",
      text: "text-cyan-600",
      hoverBg: "group-hover:bg-cyan-600",
      hoverText: "group-hover:text-white",
      glow: "bg-cyan-400/20",
      line: "group-hover:bg-cyan-500",
      title: "group-hover:text-cyan-600",
    },
    {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      hoverBg: "group-hover:bg-emerald-600",
      hoverText: "group-hover:text-white",
      glow: "bg-emerald-400/20",
      line: "group-hover:bg-emerald-500",
      title: "group-hover:text-emerald-600",
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8faff] text-[#101828]">
      {/* =========================================================
          GLOBAL BACKGROUND
      ========================================================= */}

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-15%] top-[-10%] h-[550px] w-[550px] rounded-full bg-blue-200/30 blur-[120px]" />

        <div className="absolute right-[-12%] top-[5%] h-[650px] w-[650px] rounded-full bg-indigo-200/25 blur-[140px]" />

        <div className="absolute bottom-[-15%] left-[25%] h-[500px] w-[500px] rounded-full bg-cyan-100/40 blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.28]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(99,102,241,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,.055) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_15%,#f8faff_85%)]" />
      </div>

      {/* =========================================================
          HERO
      ========================================================= */}

      <section
        className="relative overflow-hidden pb-20 pt-10 sm:pt-14 lg:pb-28 lg:pt-20"
        aria-labelledby="hero-heading"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[8%] top-[20%] h-2 w-2 animate-pulse rounded-full bg-blue-500 shadow-[0_0_25px_7px_rgba(59,130,246,.22)]" />

          <div className="absolute right-[14%] top-[23%] h-2 w-2 animate-pulse rounded-full bg-indigo-400 shadow-[0_0_25px_7px_rgba(99,102,241,.2)] [animation-delay:1s]" />

          <div className="absolute bottom-[25%] left-[22%] h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_20px_5px_rgba(34,211,238,.18)] [animation-delay:2s]" />

          <div className="absolute right-[30%] top-[40%] h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400 [animation-delay:1.5s]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-[.92fr_1.08fr] lg:gap-10">
            {/* HERO LEFT */}

            <div className="relative z-10">
              <Reveal delay={30}>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/75 px-4 py-2 text-xs font-semibold text-blue-700 shadow-[0_8px_30px_rgba(37,99,235,.07)] backdrop-blur-xl">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                  </span>

                  Made for the Philippines

                  <ArrowUpRight size={13} />
                </div>
              </Reveal>

              <Reveal delay={80}>
                <h1
                  id="hero-heading"
                  className="mt-7 max-w-3xl font-display text-[3.5rem] font-bold leading-[.94] tracking-[-0.055em] text-[#111827] sm:text-6xl md:text-7xl lg:text-[5.8rem]"
                >
                  Lost something?
                  <br />

                  <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                    Let&apos;s bring it back.
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={130}>
                <p className="mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                  FindBack PH connects people who lost something with people
                  who found it — safely, quickly, and locally.
                </p>
              </Reveal>

              {/* ACTIONS */}

              <Reveal delay={170}>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/report/lost"
                    className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_35px_rgba(37,99,235,.22)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(37,99,235,.3)]"
                  >
                    I Lost Something

                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>

                  <Link
                    href="/report/found"
                    className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white"
                  >
                    <HeartHandshake
                      size={17}
                      className="text-emerald-500"
                    />

                    I Found Something
                  </Link>
                </div>
              </Reveal>

              {/* SEARCH */}

              <Reveal delay={210}>
                <div className="mt-9 max-w-2xl">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Search size={15} className="text-blue-600" />
                    Search lost & found reports
                  </div>

                  <form
                    action="/search"
                    method="GET"
                    className="group rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_15px_45px_rgba(15,23,42,.08)] transition duration-300 focus-within:border-blue-300 focus-within:shadow-[0_20px_55px_rgba(37,99,235,.12)]"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="flex min-h-[54px] flex-1 items-center gap-3 rounded-xl px-3">
                        <Search
                          size={19}
                          className="shrink-0 text-slate-400"
                        />

                        <input
                          type="text"
                          name="q"
                          placeholder="What did you lose?"
                          className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                          aria-label="Search item"
                        />
                      </div>

                      <div className="hidden h-10 w-px self-center bg-slate-200 sm:block" />

                      <div className="flex min-h-[54px] flex-1 items-center gap-3 rounded-xl px-3">
                        <MapPin
                          size={19}
                          className="shrink-0 text-slate-400"
                        />

                        <input
                          type="text"
                          name="location"
                          placeholder="Where?"
                          className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                          aria-label="Search location"
                        />
                      </div>

                      <button
                        type="submit"
                        className="flex min-h-[54px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,.2)] transition hover:bg-blue-700 active:scale-[.98]"
                      >
                        Search
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </form>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck
                        size={13}
                        className="text-emerald-500"
                      />
                      Private by default
                    </span>

                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-blue-500" />
                      Location-based
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Users size={13} className="text-indigo-500" />
                      Community-powered
                    </span>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* HERO VISUAL */}

            <Reveal delay={180}>
              <div className="relative mx-auto w-full max-w-[650px] lg:ml-auto">
                <div className="absolute left-1/2 top-1/2 h-[400px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/25 blur-[100px]" />

                <div className="absolute left-1/2 top-1/2 hidden h-[470px] w-[470px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-200/40 lg:block" />

                <div className="absolute left-1/2 top-1/2 hidden h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-100/50 lg:block" />

                <div className="relative z-10 rounded-[30px] border border-white/80 bg-white/80 p-2.5 shadow-[0_35px_90px_rgba(37,65,120,.17)] backdrop-blur-2xl">
                  <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                      <div className="flex gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                      </div>

                      <div className="hidden rounded-full bg-slate-50 px-6 py-1.5 text-[10px] font-medium text-slate-400 sm:block">
                        findback.ph
                      </div>

                      <div className="h-7 w-7 rounded-full bg-blue-50" />
                    </div>

                    <div className="relative min-h-[390px] overflow-hidden bg-[#f5f8ff]">
                      <div
                        className="absolute inset-0 opacity-60"
                        style={{
                          backgroundImage:
                            "linear-gradient(rgba(59,130,246,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,.07) 1px, transparent 1px)",
                          backgroundSize: "42px 42px",
                        }}
                      />

                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(96,165,250,.15),transparent_55%)]" />

                      {/* Phone */}

                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="relative h-[210px] w-[125px] rotate-[-8deg] rounded-[27px] border-[7px] border-slate-800 bg-slate-900 shadow-[0_25px_60px_rgba(15,23,42,.22)]">
                          <div className="absolute inset-[5px] overflow-hidden rounded-[18px] bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600">
                            <div className="absolute left-1/2 top-3 h-4 w-12 -translate-x-1/2 rounded-full bg-slate-900/80" />

                            <div className="absolute bottom-8 left-5 right-5 space-y-2">
                              <div className="h-2 rounded-full bg-white/50" />
                              <div className="h-2 w-2/3 rounded-full bg-white/30" />
                            </div>
                          </div>
                        </div>

                        <div className="absolute -inset-8 -z-10 rounded-full bg-blue-400/20 blur-3xl" />
                      </div>

                      {/* Markers */}

                      <div className="absolute left-[15%] top-[30%] animate-bounce [animation-duration:3s]">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white shadow-lg">
                          <MapPin size={15} />
                        </div>
                      </div>

                      <div className="absolute right-[18%] top-[53%] animate-bounce [animation-duration:3.5s] [animation-delay:.5s]">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-indigo-500 text-white shadow-lg">
                          <MapPin size={15} />
                        </div>
                      </div>

                      <div className="absolute left-[22%] top-[44%] h-[1px] w-[150px] rotate-[20deg] border-t border-dashed border-blue-300" />

                      {/* Preview */}

                      <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white bg-white/90 p-4 shadow-[0_15px_40px_rgba(15,23,42,.1)] backdrop-blur-xl">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Smartphone size={19} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600">
                                Found item
                              </span>

                              <span className="h-1 w-1 rounded-full bg-slate-300" />

                              <span className="text-[9px] text-slate-400">
                                Nearby
                              </span>
                            </div>

                            <p className="mt-1 truncate text-sm font-bold text-slate-900">
                              Possible phone match
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-500">
                              Reported by a community member
                            </p>
                          </div>

                          <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-600">
                            MATCH
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating notification */}

                <div className="absolute -left-4 top-[22%] z-20 hidden w-56 animate-[float_4s_ease-in-out_infinite] rounded-2xl border border-white bg-white/95 p-3.5 shadow-[0_20px_50px_rgba(15,23,42,.13)] backdrop-blur-xl sm:block lg:-left-10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Sparkles size={17} />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        New possible match
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-500">
                        Your item may have been found
                      </p>
                    </div>
                  </div>
                </div>

                {/* Match */}

                <div className="absolute -right-4 top-[50%] z-20 hidden animate-[float_5s_ease-in-out_infinite_reverse] rounded-2xl border border-white bg-white/95 p-3.5 shadow-[0_20px_50px_rgba(15,23,42,.13)] backdrop-blur-xl sm:block lg:-right-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600">
                      <CheckCircle2 size={17} />
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                        Possible match
                      </p>

                      <p className="mt-0.5 text-sm font-bold text-slate-900">
                        92% match
                      </p>
                    </div>
                  </div>
                </div>

                {/* Safe handover */}

                <div className="absolute -bottom-4 right-[7%] z-20 hidden animate-[float_4.5s_ease-in-out_infinite] rounded-2xl border border-white bg-white/95 px-4 py-3 shadow-[0_20px_50px_rgba(15,23,42,.13)] backdrop-blur-xl sm:block">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <ShieldCheck size={15} />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Safer handover
                      </p>

                      <p className="text-[9px] text-slate-500">
                        Verify before returning
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* =========================================================
          TRUST STRIP
      ========================================================= */}

      <section className="border-y border-slate-200/80 bg-white/65">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid divide-y divide-slate-200/80 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {[
              {
                icon: ShieldCheck,
                title: "Private by default",
                text: "Sensitive details stay protected.",
              },
              {
                icon: MapPin,
                title: "Local discovery",
                text: "Find reports near relevant places.",
              },
              {
                icon: HeartHandshake,
                title: "Safer returns",
                text: "Verify before handing anything over.",
              },
              {
                icon: Users,
                title: "Community powered",
                text: "People helping people recover.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="group flex items-center gap-3 px-5 py-6 transition hover:bg-blue-50/40 sm:justify-center sm:py-7"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition duration-300 group-hover:scale-110">
                    <Icon size={17} />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {item.title}
                    </p>

                    <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          LIVE STATS
      ========================================================= */}

      <section className="relative py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-10 max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Community pulse
              </p>

              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Real people. Real reports.
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                See what&apos;s happening across the FindBack PH community.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-0 border-y border-slate-200 lg:grid-cols-3 lg:divide-x lg:divide-slate-200">
            {/* Lost */}

            <Reveal delay={50}>
              <div className="group relative overflow-hidden px-2 py-10 sm:px-6 lg:px-8">
                <div className="absolute right-5 top-5 h-28 w-28 rounded-full bg-blue-100/70 blur-3xl transition group-hover:scale-125" />

                <div className="relative">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                    <Search size={14} className="text-blue-500" />
                    Active lost
                  </div>

                  <div className="mt-3 flex items-end gap-3">
                    <span className="font-display text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl">
                      {activeLost.toLocaleString()}
                    </span>

                    <span className="mb-2 text-xs text-slate-500">
                      people searching
                    </span>
                  </div>

                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[68%] animate-pulse rounded-full bg-blue-500" />
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Found */}

            <Reveal delay={100}>
              <div className="group relative overflow-hidden px-2 py-10 sm:px-6 lg:px-8">
                <div className="absolute right-5 top-5 h-28 w-28 rounded-full bg-emerald-100/70 blur-3xl transition group-hover:scale-125" />

                <div className="relative">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                    <HeartHandshake
                      size={14}
                      className="text-emerald-500"
                    />
                    Active found
                  </div>

                  <div className="mt-3 flex items-end gap-3">
                    <span className="font-display text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl">
                      {activeFound.toLocaleString()}
                    </span>

                    <span className="mb-2 text-xs text-slate-500">
                      waiting for owners
                    </span>
                  </div>

                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[54%] animate-pulse rounded-full bg-emerald-500 [animation-delay:.4s]" />
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Recovered */}

            <Reveal delay={150}>
              <div className="group relative overflow-hidden px-2 py-10 sm:px-6 lg:px-8">
                <div className="absolute right-5 top-5 h-28 w-28 rounded-full bg-cyan-100/70 blur-3xl transition group-hover:scale-125" />

                <div className="relative">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                    <CheckCircle2
                      size={14}
                      className="text-cyan-500"
                    />
                    Successfully returned
                  </div>

                  <div className="mt-3 flex items-end gap-3">
                    <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text font-display text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
                      {recovered.toLocaleString()}
                    </span>

                    <span className="mb-2 text-xs text-slate-500">
                      recovery stories
                    </span>
                  </div>

                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[82%] animate-pulse rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 [animation-delay:.8s]" />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* =========================================================
          WHAT DO YOU NEED?
      ========================================================= */}

      <section className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28">
        <div className="absolute right-[-10%] top-[-30%] h-[500px] w-[500px] rounded-full bg-blue-100/60 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-[.75fr_1.25fr] lg:items-center">
            <Reveal>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                  Start here
                </p>

                <h2 className="mt-4 max-w-lg font-display text-4xl font-bold leading-tight tracking-[-0.035em] text-slate-950 sm:text-5xl">
                  What brings you to FindBack?
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-slate-500 sm:text-base">
                  Whether you lost something or found something, there&apos;s
                  a simple next step.
                </p>
              </div>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* LOST */}

              <Reveal delay={80}>
                <Link
                  href="/report/lost"
                  className="group relative block overflow-hidden rounded-[28px] border border-slate-200 bg-[#f7f9ff] p-7 transition duration-500 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_25px_60px_rgba(37,99,235,.1)]"
                >
                  <div className="absolute right-[-35px] top-[-35px] h-36 w-36 rounded-full bg-blue-100 opacity-70 blur-2xl transition group-hover:bg-blue-200" />

                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 transition duration-300 group-hover:scale-110 group-hover:rotate-3">
                        <Search size={21} />
                      </div>

                      <ArrowUpRight
                        size={20}
                        className="text-slate-300 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-blue-600"
                      />
                    </div>

                    <p className="mt-8 text-xs font-bold uppercase tracking-wider text-blue-600">
                      I need help
                    </p>

                    <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">
                      I lost something
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      Search reports, create a lost item report, and look for
                      possible matches.
                    </p>

                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                      Start searching
                      <ArrowRight
                        size={15}
                        className="text-blue-600 transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                </Link>
              </Reveal>

              {/* FOUND */}

              <Reveal delay={140}>
                <Link
                  href="/report/found"
                  className="group relative block overflow-hidden rounded-[28px] border border-slate-200 bg-[#f8fcfa] p-7 transition duration-500 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_25px_60px_rgba(16,185,129,.1)]"
                >
                  <div className="absolute right-[-35px] top-[-35px] h-36 w-36 rounded-full bg-emerald-100 opacity-70 blur-2xl transition group-hover:bg-emerald-200" />

                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-200 transition duration-300 group-hover:scale-110 group-hover:rotate-3">
                        <HeartHandshake size={21} />
                      </div>

                      <ArrowUpRight
                        size={20}
                        className="text-slate-300 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-emerald-600"
                      />
                    </div>

                    <p className="mt-8 text-xs font-bold uppercase tracking-wider text-emerald-600">
                      I can help
                    </p>

                    <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">
                      I found something
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      Report what you found and give its owner a better chance
                      of getting it back.
                    </p>

                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                      Create found report
                      <ArrowRight
                        size={15}
                        className="text-emerald-600 transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                </Link>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PREMIUM CATEGORY EXPLORER
      ========================================================= */}

      <section
        className="relative overflow-hidden border-y border-slate-200 bg-[#f7f9ff] py-20 sm:py-24 lg:py-28"
        aria-labelledby="categories-heading"
      >
        {/* Background atmosphere */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-10%] top-[10%] h-[400px] w-[400px] rounded-full bg-blue-200/30 blur-[120px]" />

          <div className="absolute right-[-10%] bottom-[-20%] h-[450px] w-[450px] rounded-full bg-indigo-200/25 blur-[130px]" />

          <div
            className="absolute inset-0 opacity-[0.22]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(59,130,246,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,.06) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* HEADER */}

          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <Reveal>
              <div className="max-w-2xl">
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-px w-10 bg-blue-500" />

                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-600">
                    Explore reports
                  </span>
                </div>

                <h2
                  id="categories-heading"
                  className="font-display text-4xl font-bold tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl"
                >
                  What are you
                  <span className="block text-slate-300">
                    looking for?
                  </span>
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
                  Start with a category and quickly narrow down reports
                  to find something that looks familiar.
                </p>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <Link
                href="/search"
                className="group inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 hover:shadow-lg"
              >
                Browse everything

                <ArrowUpRight
                  size={16}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
            </Reveal>
          </div>

          {/* CATEGORY GRID */}

          <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((category, index) => {
              const icon =
                categoryIcons[category] ?? <PackageSearch size={20} />;

              const accent =
                categoryStyles[index % categoryStyles.length];

              return (
                <Reveal
                  key={category}
                  delay={index * 45}
                >
                  <Link
                    href={`/search?category=${category}`}
                    className="group relative block h-full min-h-[190px] overflow-hidden rounded-[26px] border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,.035)] transition-all duration-500 hover:-translate-y-1.5 hover:border-transparent hover:shadow-[0_25px_60px_rgba(15,23,42,.1)]"
                  >
                    {/* Glow */}

                    <div
                      className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full ${accent.glow} opacity-0 blur-3xl transition duration-500 group-hover:opacity-100`}
                    />

                    {/* Large number */}

                    <div className="absolute right-5 top-5 font-display text-[52px] font-bold leading-none tracking-[-0.08em] text-slate-100 transition duration-500 group-hover:scale-110 group-hover:text-slate-200">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="relative flex h-full flex-col justify-between">
                      {/* ICON */}

                      <div className="flex items-start justify-between">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent.bg} ${accent.text} ${accent.hoverBg} ${accent.hoverText} transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}
                        >
                          {icon}
                        </div>

                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-300 transition-all duration-300 group-hover:border-slate-300 group-hover:text-slate-900">
                          <ArrowUpRight
                            size={15}
                            className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                          />
                        </div>
                      </div>

                      {/* TEXT */}

                      <div className="mt-10">
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                          Category {String(index + 1).padStart(2, "0")}
                        </p>

                        <h3
                          className={`mt-2 font-display text-xl font-bold tracking-tight text-slate-900 transition-colors duration-300 ${accent.title}`}
                        >
                          {CATEGORY_LABELS[category]}
                        </h3>

                        {/* Animated line */}

                        <div className="mt-4 h-px w-full bg-slate-100">
                          <div
                            className={`h-full w-0 ${accent.line} transition-all duration-500 group-hover:w-full`}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>

          {/* FOOTER */}

          <Reveal delay={180}>
            <div className="mt-5 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f7f9ff] bg-blue-100 text-blue-600">
                    <Search size={13} />
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f7f9ff] bg-emerald-100 text-emerald-600">
                    <HeartHandshake size={13} />
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f7f9ff] bg-indigo-100 text-indigo-600">
                    <MapPin size={13} />
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Search by category, location, and item details.
                </p>
              </div>

              <Link
                href="/search"
                className="group inline-flex items-center gap-2 text-xs font-bold text-slate-700 transition hover:text-blue-600"
              >
                Start a smarter search

                <ArrowRight
                  size={14}
                  className="text-blue-600 transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* =========================================================
          HOW IT WORKS
      ========================================================= */}

      <section
        className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28"
        aria-labelledby="how-heading"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <Reveal>
              <div className="lg:sticky lg:top-24 lg:self-start">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                  How it works
                </p>

                <h2
                  id="how-heading"
                  className="mt-4 max-w-xl font-display text-4xl font-bold leading-tight tracking-[-0.035em] text-slate-950 sm:text-5xl"
                >
                  From lost
                  <br />
                  <span className="text-slate-300">to found.</span>
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-slate-500 sm:text-base">
                  A simple process designed to make searching and returning
                  belongings easier.
                </p>

                <Link
                  href="/how-it-works"
                  className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-900"
                >
                  See how FindBack works
                  <ArrowRight
                    size={16}
                    className="text-blue-600 transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </Reveal>

            <div className="relative">
              <div className="absolute bottom-6 left-5 top-6 w-px bg-gradient-to-b from-blue-200 via-indigo-200 to-emerald-200" />

              {[
                {
                  number: "01",
                  title: "Report it",
                  text: "Tell the community what you lost or found. Add useful details so others can recognize the item.",
                  icon: PackageSearch,
                },
                {
                  number: "02",
                  title: "Discover a match",
                  text: "Search reports using item details, categories, and locations to find something that looks familiar.",
                  icon: Radar,
                },
                {
                  number: "03",
                  title: "Verify ownership",
                  text: "Use private communication and identifying details to make sure the item belongs to the right person.",
                  icon: ShieldCheck,
                },
                {
                  number: "04",
                  title: "Bring it home",
                  text: "Arrange a safe handover and turn a lost-item report into a successful recovery.",
                  icon: HeartHandshake,
                },
              ].map((step, index) => {
                const Icon = step.icon;

                return (
                  <Reveal
                    key={step.number}
                    delay={index * 90}
                  >
                    <div className="group relative flex gap-6 pb-12 last:pb-0">
                      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white shadow-lg shadow-blue-100 transition duration-300 group-hover:scale-110">
                        <Icon size={15} />
                      </div>

                      <div className="pt-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                          Step {step.number}
                        </p>

                        <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">
                          {step.title}
                        </h3>

                        <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
                          {step.text}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SAFETY
      ========================================================= */}

      <section
        className="relative overflow-hidden bg-[#f5f9ff] py-20"
        aria-labelledby="safety-heading"
      >
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/60 blur-[120px]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col items-start gap-8 border-y border-slate-200 py-10 md:flex-row md:items-center md:justify-between">
              <div className="flex max-w-3xl gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <ShieldCheck size={22} />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2
                      id="safety-heading"
                      className="font-display text-xl font-bold text-slate-950"
                    >
                      Your safety comes first.
                    </h2>

                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                      Safety first
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Keep sensitive information private, verify ownership before
                    returning an item, and choose a safe public place for
                    handovers.
                  </p>
                </div>
              </div>

              <Link
                href="/safety"
                className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
              >
                Safety guidelines

                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* =========================================================
          COMMUNITY MESSAGE
      ========================================================= */}

      <section className="relative py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <HeartHandshake size={24} />
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Built by community
            </p>

            <h2 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-bold leading-tight tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              Sometimes all it takes is
              <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                {" "}
                one person
              </span>{" "}
              to help.
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Every report gives someone another chance to recover something
              important. Every person who helps makes the community stronger.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/search"
                className="group inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Search Reports

                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/report/found"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-600"
              >
                <HeartHandshake size={17} />
                Help someone
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================= */}

      <section
        className="relative overflow-hidden bg-[#0f172a] py-20 sm:py-24 lg:py-28"
        aria-labelledby="cta-heading"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[15%] top-[-20%] h-[450px] w-[450px] rounded-full bg-blue-500/20 blur-[120px]" />

          <div className="absolute bottom-[-20%] right-[10%] h-[450px] w-[450px] rounded-full bg-indigo-500/20 blur-[120px]" />

          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-blue-300">
              <HeartHandshake size={24} />
            </div>

            <h2
              id="cta-heading"
              className="mt-7 font-display text-4xl font-bold leading-tight tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl"
            >
              Lost it?
              <br />

              <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                Found it?
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
              Let&apos;s give it a way home. Search the community or create a
              report in just a few minutes.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                href="/search"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-slate-950 shadow-[0_15px_40px_rgba(255,255,255,.08)] transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                <Search size={17} />

                Search Reports

                <ArrowRight
                  size={16}
                  className="text-blue-600 transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/report/found"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/10"
              >
                <HeartHandshake
                  size={17}
                  className="text-emerald-300"
                />

                I Found Something
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2
                  size={13}
                  className="text-emerald-400"
                />
                Safe
              </span>

              <span className="flex items-center gap-1.5">
                <CheckCircle2
                  size={13}
                  className="text-emerald-400"
                />
                Private
              </span>

              <span className="flex items-center gap-1.5">
                <CheckCircle2
                  size={13}
                  className="text-emerald-400"
                />
                Community-driven
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* =========================================================
          LOCAL ANIMATIONS
      ========================================================= */}

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes float {
              0%, 100% {
                transform: translateY(0px);
              }

              50% {
                transform: translateY(-9px);
              }
            }

            @media (prefers-reduced-motion: reduce) {
              *,
              *::before,
              *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
              }
            }
          `,
        }}
      />
    </main>
  );
}