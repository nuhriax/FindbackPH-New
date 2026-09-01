import Link from "next/link";
import { ArrowRight, Compass, HeartHandshake, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CTABand } from "@/components/page-kit/section";
import { MotionReveal, Stagger, StaggerItem } from "@/components/motion-kit";
import { CountUp } from "@/components/count-up";
import { ChapterNav } from "@/components/page-kit/chapter-nav";

const essays = [
  {
    kicker: "The problem",
    title: "Losing something is a scavenger hunt nobody chose",
    text: "Bulletin boards, Facebook groups, barangay offices, group chats of group chats. The help was usually out there, scattered across ten places, hoping you'd guess the right one. Most items never come back, not because nobody cared, but because nobody was in the same room.",
  },
  {
    kicker: "Our answer",
    title: "One room where the two halves of a recovery meet",
    text: "FindBack PH puts lost and found reports side by side, searchable by item, category, and barangay. Every feature exists for a single moment: the second someone realizes the thing they lost is actually coming home.",
  },
  {
    kicker: "Who it's for",
    title: "For the pockets-out people, and the passers-by",
    text: "For Maria, who checked her bag three times on the jeepney. For Jerome, who picked up a wallet and didn't want to just walk away. For everyone willing to spend two minutes giving a stranger their day back.",
  },
];

const differentiators = [
  "Hashed ownership challenges: a secret question only the true owner can answer, unreadable even to us.",
  "Privacy-first messaging, with no public comment threads on someone's lost wallet.",
  "Barangay-level locations, so reports are organized the way Filipinos actually describe places.",
  "No fees, no ads, no premium tiers. Recovery is the product.",
];

const beliefs = [
  "A wallet is never just a wallet. It's IDs, photos, and the money for tomorrow's fare.",
  "Every recovery happens because one neighbor posted and another one paid attention.",
  "Helping a stranger get their day back is always worth two minutes.",
];


export const metadata = {
  title: { absolute: "About FindBack PH - Helping Things Come Home" },
  description:
    "FindBack PH is a Philippine community platform that reconnects people with lost items through smart matching, private messaging, and safe returns.",
};

export default async function AboutPage() {
  const supabase = await createClient();

  const [
    { count: lostCount },
    { count: foundCount },
    { count: recoveredCount },
  ] = await Promise.all([
    supabase.from("lost_items").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("found_items").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("lost_items").select("*", { count: "exact", head: true }).eq("status", "recovered"),
  ]);

  const stats = [
    { value: lostCount ?? 0, label: "Items being looked for" },
    { value: foundCount ?? 0, label: "Items waiting to go home" },
    { value: recoveredCount ?? 0, label: "Reunions so far" },
  ];

  return (
    <main className="relative min-h-screen text-navy-900 selection:bg-navy-200/40">
      {/* EDITORIAL HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 pb-14 pt-20 sm:px-6 sm:pt-28">
          <MotionReveal direction="blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric-600">
              Chapter 03 · The Manifesto
            </p>
          </MotionReveal>

          <MotionReveal direction="up" className="mt-6">
            <h1 className="font-display text-[2.75rem] font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
              We bring things{" "}
              <span className="text-gradient-brand">home.</span>
            </h1>
          </MotionReveal>

          <MotionReveal direction="up" delay={0.1} className="mt-7 max-w-2xl">
            <p className="text-lg leading-8 text-slate-600">
              FindBack PH is a free community platform for the Philippines
              where lost and found reports live in one place, so a phone
              left on a tricycle and the stranger holding it can find each
              other without either of them giving up.
            </p>
          </MotionReveal>

          {/* Live counts */}
          <MotionReveal direction="up" delay={0.18} className="mt-10">
            <dl className="grid gap-px overflow-hidden rounded-3xl border border-navy-100 bg-navy-100/60 shadow-soft sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white/90 px-6 py-6 backdrop-blur">
                  <dd className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                    <CountUp value={stat.value} />
                  </dd>
                  <dt className="mt-1.5 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
            <p className="mt-2.5 text-xs text-slate-400">
              Live counts from real FindBack PH reports.
            </p>
          </MotionReveal>
        </div>
      </section>

      {/* MANIFESTO PULL-QUOTE */}
      <section className="relative overflow-hidden bg-ink-900 py-16 text-white sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_260px_at_50%_120%,rgba(15,123,122,0.35),transparent_70%)]"
        />
        <MotionReveal direction="blur" className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="font-display text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
            &ldquo;A wallet is never just a wallet. It&apos;s IDs, photographs,
            and tomorrow&apos;s fare. When it goes home, more than an object
            comes back.&rdquo;
          </p>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">
            Why we built this
          </p>
        </MotionReveal>
      </section>


      {/* THE ESSAYS */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <MotionReveal direction="right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric-600">
                The long version
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Three short essays on why this place exists
              </h2>
              <p className="mt-3 flex items-start gap-2.5 text-sm leading-7 text-slate-600">
                <Compass aria-hidden="true" size={17} className="mt-1 shrink-0 text-electric-500" />
                Read them in order; they build on each other.
              </p>
            </MotionReveal>
          </div>

          <Stagger className="space-y-8">
            {essays.map((essay, i) => (
              <StaggerItem key={essay.kicker}>
                <article className="relative border-l-2 border-dashed border-electric-200 pl-7 sm:pl-9">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-electric-400 bg-cream"
                  />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-400">
                    {String(i + 1).padStart(2, "0")} · {essay.kicker}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-bold tracking-tight sm:text-2xl">
                    {essay.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-8 text-slate-600">
                    {essay.text}
                  </p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* WHAT MAKES US DIFFERENT */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <MotionReveal direction="up" className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric-600">
            Not just another bulletin board
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Four things we refused to compromise on
          </h2>
        </MotionReveal>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2">
          {differentiators.map((item, i) => (
            <MotionReveal key={item} direction="up" delay={i * 0.06} as="li">
              <div className="flex h-full items-start gap-4 rounded-3xl border border-slate-200/70 bg-white/85 p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
                <span className="font-display text-2xl font-extrabold text-electric-200">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-sm leading-7 text-slate-700">{item}</p>
              </div>
            </MotionReveal>
          ))}
        </ol>
      </section>

      {/* WHAT WE BELIEVE */}
      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 sm:pb-20">
        <MotionReveal direction="up" className="text-center">
          <Sparkles aria-hidden="true" size={20} className="mx-auto text-sunrise-500" />
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Small acts, big reunions
          </h2>
        </MotionReveal>
        <div className="mt-8 space-y-3">
          {beliefs.map((belief, i) => (
            <MotionReveal key={belief} direction="blur" delay={i * 0.08}>
              <p className="mx-auto max-w-xl rounded-2xl border border-slate-200/70 bg-white/85 px-6 py-4 text-center text-sm leading-7 text-slate-700 shadow-soft">
                {belief}
              </p>
            </MotionReveal>
          ))}
        </div>
        <MotionReveal direction="up" className="mt-10 text-center">
          <Link
            href="/discover"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-electric-700"
          >
            <HeartHandshake size={16} aria-hidden="true" />
            See what the community has found so far
            <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </MotionReveal>
      </section>

      {/* CHAPTER RAIL */}
      <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <ChapterNav current="about" />
      </section>

      <CTABand
        title="Be part of someone's good day."
        description="Join the community that brings lost things back where they belong: free, private, and safe by design."
        actions={[
          { href: "/report/lost", label: "Report a lost item", primary: true },
          { href: "/report/found", label: "Report a found item" },
        ]}
      />
    </main>
  );
}
