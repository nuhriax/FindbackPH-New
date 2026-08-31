import {
  BadgeCheck,
  EyeOff,
  Handshake,
  Landmark,
  Lock,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserCheck,
  Users,
} from "lucide-react";
import { CTABand, Faq } from "@/components/page-kit/section";
import { MotionReveal, Stagger, StaggerItem } from "@/components/motion-kit";
import { SignalFlipper } from "@/components/page-kit/signal-flipper";
import { ChapterNav } from "@/components/page-kit/chapter-nav";

const goldenRules = [
  {
    icon: UserCheck,
    title: "Description beats a photo",
    text: "Before any handover, ask for identifying details only the true owner would know — contents, scratches, stickers, wear.",
  },
  {
    icon: Users,
    title: "Meet in public, never alone",
    text: "Busy, familiar places. Daylight if you can. Tell someone you trust the plan before you go.",
  },
  {
    icon: MessageCircle,
    title: "Keep it on FindBack",
    text: "In-app messaging keeps a record and shields your number. A rush to move elsewhere is a warning, not a preference.",
  },
  {
    icon: Lock,
    title: "Never send money",
    text: "FindBack never charges to return an item. 'Release fees' and 'shipping fees' are the oldest scam in the book.",
  },
  {
    icon: Handshake,
    title: "You can always walk away",
    text: "Pressure, guilt, and urgency are tactics. No item is worth your safety — pausing is always allowed.",
  },
];

const meetingSpots = [
  { icon: ShoppingBag, title: "Shopping malls", text: "Well-lit, monitored, busy at most hours — ideal for weekday handovers." },
  { icon: Store, title: "Cafes & restaurants", text: "Public and comfortable, easy to leave, with staff around." },
  { icon: Landmark, title: "Barangay halls", text: "A community option close to home, with people around." },
  { icon: Users, title: "Busy public spaces", text: "Plazas, terminals, campus areas with steady foot traffic." },
];

const protections = [
  {
    icon: Lock,
    title: "Hashed ownership challenges",
    text: "A secret question only the true owner can answer — hashed the moment it's saved, never readable even by us.",
  },
  {
    icon: EyeOff,
    title: "Privacy by default",
    text: "Your phone number and email never appear on reports. Contact details surface only if you choose to share them.",
  },
  {
    icon: ShieldCheck,
    title: "Signed photo links",
    text: "Report photos are served through signed, expiring URLs — they can't be hotlinked, saved forever, or scraped.",
  },
  {
    icon: BadgeCheck,
    title: "One-tap reporting",
    text: "Every profile and message thread carries a report button. Flags go straight to moderators, with the chat record attached.",
  },
];


const faqs = [
  {
    q: "Someone is asking me to pay a 'release fee'. Is that real?",
    a: "No. FindBack never charges anything to return an item — no release fees, no shipping fees, no rewards. Anyone asking for money to return a found item is scamming you. Report them and stop replying.",
  },
  {
    q: "How do I verify someone really owns the item?",
    a: "Description beats a photo. Ask for specific identifying details — contents, marks, stickers, wear. If the reporter set an ownership challenge, a correct answer clears the way without any guessing.",
  },
  {
    q: "Is it safe to meet a stranger for a handover?",
    a: "It can be, when you control the terms: meet in a busy public place, daylight if possible, tell someone your plan, keep chat in FindBack, and end the handover the moment something feels wrong.",
  },
  {
    q: "How do I report a scammer?",
    a: "Use the report button on their profile or message thread. Flags go straight to moderators, and keeping the chat on FindBack gives them the evidence they need to act.",
  },
];

export const metadata = {
  title: { absolute: "Safety Guide — FindBack PH" },
  description:
    "Practical safety habits for meetups, communication, and recoveries on FindBack PH. You stay in control of every step.",
};

export default function SafetyPage() {
  return (
    <main className="relative min-h-screen text-navy-900 selection:bg-leaf-300/30">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle 20rem at 8% -6rem, rgba(223,243,229,0.6), transparent 70%)," +
              "radial-gradient(circle 20rem at 106% calc(100% + 8rem), rgba(214,239,235,0.6), transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pt-24">
          <MotionReveal direction="blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-leaf-700">
              Chapter 02 · The Field Manual
            </p>
          </MotionReveal>

          <MotionReveal direction="up" className="mt-5 max-w-3xl">
            <h1 className="font-display text-[2.5rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Good people deserve to stay{" "}
              <span className="bg-gradient-to-r from-leaf-600 to-teal-500 bg-clip-text text-transparent">
                safe
              </span>
              , too.
            </h1>
          </MotionReveal>

          <MotionReveal direction="up" delay={0.1} className="mt-6 max-w-xl">
            <p className="text-base leading-8 text-slate-600 sm:text-lg">
              You&apos;re here to return a wallet or find a lost phone, not to
              defend yourself from scams. This guide gives you practical habits
              and tools, so helping someone never has to feel risky.
            </p>
          </MotionReveal>

          <MotionReveal direction="up" delay={0.18} className="mt-8">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5 shadow-soft">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 animate-pulse-soft rounded-full bg-rose-500" />
              <p className="text-sm font-medium text-rose-700">
                If anything feels wrong at a meetup, leave. The item can wait. You can&apos;t be replaced.
              </p>
            </div>
          </MotionReveal>
        </div>
      </section>


      {/* S01 GOLDEN RULES */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <Stagger className="space-y-4">
          {goldenRules.map((rule, i) => (
            <StaggerItem key={rule.title}>
              <div className="group flex items-start gap-5 rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-soft transition hover:border-leaf-300 hover:shadow-card sm:p-7">
                <span
                  aria-hidden="true"
                  className="font-display text-4xl font-extrabold leading-none text-leaf-200 transition group-hover:text-leaf-400 sm:text-5xl"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="flex items-center gap-2.5 font-display text-base font-bold sm:text-lg">
                    <rule.icon size={18} aria-hidden="true" className="shrink-0 text-leaf-600" />
                    {rule.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                    {rule.text}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* S02 SIGNALS */}
      <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <MotionReveal direction="up" className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric-600">
            §02 · Reading a conversation
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Learn the signals before you need them
          </h2>
        </MotionReveal>
        <div className="mt-10">
          <SignalFlipper />
        </div>
      </section>


      {/* S03 MEETING SPOTS */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <MotionReveal direction="up" className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric-600">
            §03 · Where to meet
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Pick a place where people already are
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            The best handover spots are the ordinary ones: the places you
            already pass on a normal day. A return shouldn&apos;t feel like an
            adventure.
          </p>
        </MotionReveal>

        <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {meetingSpots.map((spot) => (
            <StaggerItem key={spot.title}>
              <div className="h-full rounded-3xl border border-slate-200/70 bg-white/85 p-5 shadow-soft transition hover:-translate-y-1 hover:border-electric-200 hover:shadow-card">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-electric-50 text-electric-700 ring-1 ring-electric-100">
                  <spot.icon size={19} aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-sm font-bold">{spot.title}</h3>
                <p className="mt-1.5 text-xs leading-6 text-slate-600">{spot.text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* S04 PLATFORM PROTECTIONS */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <MotionReveal direction="right" className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-electric-600">
              §04 · What we do for you
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              The rules above are yours. These are ours.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Safety isn&apos;t a page you read once. It&apos;s built into how
              the platform behaves, whether you think about it or not.
            </p>
          </MotionReveal>

          <Stagger className="grid gap-4 sm:grid-cols-2">
            {protections.map((p) => (
              <StaggerItem key={p.title}>
                <div className="h-full rounded-3xl border border-slate-200/70 bg-white/85 p-5 shadow-soft transition hover:border-leaf-300 hover:shadow-card">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-leaf-50 text-leaf-700 ring-1 ring-leaf-100">
                    <p.icon size={18} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-display text-sm font-bold">{p.title}</h3>
                  <p className="mt-1.5 text-xs leading-6 text-slate-600 sm:text-sm">
                    {p.text}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* CHAPTER RAIL */}
      <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <ChapterNav current="safety" />
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Faq items={faqs} />
      </section>

      <CTABand
        title="Safe hands, safe returns."
        description="Follow the manual, trust the tools, and every handover can be as uneventful as it should be."
        actions={[
          { href: "/report/lost", label: "Report a lost item", primary: true },
          { href: "/report/found", label: "Report a found item" },
        ]}
      />
    </main>
  );}
