import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  HeartHandshake,
  Lock,
  MapPin,
  PackageSearch,
  ShieldCheck,
} from "lucide-react";
import { CTABand, Faq } from "@/components/page-kit/section";
import { MotionReveal, Stagger, StaggerItem, Float } from "@/components/motion-kit";
import { JourneyTracks } from "@/components/page-kit/journey-tracks";
import { ChapterNav } from "@/components/page-kit/chapter-nav";

const promises = [
  {
    icon: Lock,
    title: "Your details stay yours",
    text: "Contact info stays hidden behind FindBack chat until you choose to share it. Nobody sees your number.",
  },
  {
    icon: ShieldCheck,
    title: "Proof beats photos",
    text: "Ownership challenges ask a question only the true owner can answer. Hashed on save, invisible to everyone else.",
  },
  {
    icon: MapPin,
    title: "Public meetups, always",
    text: "Every safety guide points to one place: busy, familiar, and public. Malls, barangay halls, or cafés, never someone's doorstep.",
  },
];

const story = [
  {
    who: "Maria, a nurse in Quezon City,",
    text: "left her wallet on a jeepney and posted a report that night — cards, receipts, a photo of the stitched lining. She expected nothing.",
  },
  {
    who: "Jerome, a student passing by,",
    text: "had picked it up and posted it the same hour. He described the lining stitch but kept one card's name to himself — the detail only Maria could know.",
  },
  {
    who: "The next morning,",
    text: "FindBack put the two reports side by side. They chatted in-app, she named the card, they met at a mall food court — and the wallet went home before her lunch shift.",
  },
];

const faqs = [
  {
    q: "How does FindBack match lost and found items?",
    a: "Reports carry item details, category, location, and date. FindBack surfaces found reports that line up with yours so you can review and confirm. Matching helps, but you always make the final call.",
  },
  {
    q: "Is my personal information visible to everyone?",
    a: "No. FindBack is designed to limit exposure of personal details. Coordinate through in-app messaging and never share passwords, OTPs, or financial details with anyone.",
  },
  {
    q: "What should I do if I found someone's item?",
    a: "Create a found report with enough information for the true owner to recognize it, but hold back one or two identifying details that only the real owner could confirm.",
  },
  {
    q: "Where should a handover happen?",
    a: "Somewhere busy, familiar, and public: a mall, barangay hall, or café. Tell someone you trust about the plan, and keep the conversation on FindBack.",
  },
  {
    q: "How do I know the claimant is the real owner?",
    a: "Don't rely on appearance alone. Ask for specific identifying details, or rely on the ownership challenge the reporter may have set: a secret question only the true owner can answer.",
  },
];

export const metadata = {
  title: { absolute: "How FindBack PH Works — From Lost to Reunited" },
  description:
    "From report to reunion: see how FindBack PH matches lost and found items, how to verify an item before returning it, and what happens after a match, step by step.",
};

export default function HowItWorksPage() {
  const faqSchema = faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  }));

  return (
    <main className="relative min-h-screen text-navy-900 selection:bg-sunrise-300/30">
  {/* section */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-[-6%] h-[24rem] w-[24rem] rounded-full bg-sunrise-100/50 blur-3xl" />
          <div className="absolute bottom-[-30%] left-[-8%] h-[28rem] w-[28rem] rounded-full bg-leaf-100/50 blur-3xl" />
          <svg
            className="absolute inset-x-0 top-8 h-40 w-full text-electric-300/40"
            viewBox="0 0 1200 160"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M-20 130 C 200 20, 340 150, 560 60 S 950 150, 1220 40"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="2 14"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-24 lg:pt-28">
          <MotionReveal direction="blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric-600">
              Chapter 01 · The Journey
            </p>
          </MotionReveal>

          <MotionReveal direction="up" className="mt-5 max-w-3xl">
            <h1 className="font-display text-[2.5rem] font-extrabold leading-[1.04] tracking-tight sm:text-6xl">
              Losing something feels{" "}
              <span className="bg-gradient-to-r from-sunrise-600 to-sunrise-400 bg-clip-text text-transparent">
                heavy.
              </span>{" "}
              Getting it back is{" "}
              <span className="bg-gradient-to-r from-leaf-600 to-electric-500 bg-clip-text text-transparent">
                four steps.
              </span>
            </h1>
          </MotionReveal>

          <MotionReveal direction="up" delay={0.1} className="mt-6 max-w-xl">
            <p className="text-base leading-8 text-slate-600 sm:text-lg">
              This page is written for the moment you&apos;re in, whether
              you&apos;re turning your pockets out for the tenth time, or
              holding a stranger&apos;s belonging and wondering what to do
              next. Pick your side of the story below.
            </p>
          </MotionReveal>

          <MotionReveal direction="up" delay={0.18} className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/report/lost"
              className="group inline-flex items-center gap-2 rounded-button bg-gradient-to-b from-sunrise-500 to-sunrise-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sunrise-500/25 transition hover:shadow-xl"
            >
              <ClipboardList size={16} aria-hidden="true" />
              Report something lost
              <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/report/found"
              className="group inline-flex items-center gap-2 rounded-button border border-leaf-200 bg-white/85 px-6 py-3 text-sm font-semibold text-leaf-700 shadow-soft transition hover:border-leaf-300 hover:bg-white"
            >
              <PackageSearch size={16} aria-hidden="true" />
              Report something found
            </Link>
          </MotionReveal>
        </div>
      </section>

  {/* section */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <JourneyTracks />
      </section>

  {/* section */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <MotionReveal direction="up" className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric-600">
            While you&apos;re doing this
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Three things that never change, whichever path you take
          </h2>
        </MotionReveal>

        <Stagger className="mt-8 grid gap-4 md:grid-cols-3">
          {promises.map((p) => (
            <StaggerItem key={p.title}>
              <div className="h-full rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-card">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-electric-50 text-electric-700 ring-1 ring-electric-100">
                  <p.icon size={19} aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold">{p.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{p.text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

  {/* section */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.4fr] lg:items-start">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <MotionReveal direction="right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sunrise-600">
                What a recovery looks like
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                This is what it feels like
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Every recovered report on FindBack looks something like this:
                two strangers, one item, and the moment it goes home.
              </p>
              <Float distance={8}>
                <div className="mt-6 rounded-3xl border border-sunrise-100 bg-gradient-to-br from-sunrise-50 to-white p-6 shadow-soft">
                  <HeartHandshake aria-hidden="true" size={22} className="text-sunrise-500" />
                  <p className="mt-3 font-display text-lg font-bold leading-relaxed">
                    &ldquo;No phone numbers were exchanged. No money changed
                    hands. The wallet simply went home.&rdquo;
                  </p>
                </div>
              </Float>
            </MotionReveal>
          </div>

          <ol className="space-y-4">
            {story.map((beat, i) => (
              <MotionReveal key={beat.who} direction="left" delay={i * 0.08} as="li">
                <div className="flex gap-5 rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-soft transition hover:border-sunrise-200">
                  <span aria-hidden="true" className="font-display text-3xl font-extrabold leading-none text-sunrise-200 sm:text-4xl">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-7 text-slate-600">
                    <span className="font-semibold text-navy-900">{beat.who}</span>{" "}
                    {beat.text}
                  </p>
                </div>
              </MotionReveal>
            ))}
          </ol>
        </div>
      </section>

  {/* section */}
      <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <ChapterNav current="how-it-works" />
      </section>

  {/* section */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Faq items={faqs} />
      </section>

      <CTABand
        title="Your four steps can start right now."
        description="Post a report in under two minutes, and give the other half of this story a chance to find you."
        actions={[
          { href: "/report/lost", label: "I lost something", primary: true },
          { href: "/report/found", label: "I found something" },
        ]}
      />
    </main>
  );
}
