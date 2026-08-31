import Link from "next/link";
import { KeyRound, Lock, ShieldCheck, Sparkles } from "lucide-react";

import { Reveal } from "@/components/reveal";

/**
 * Safety Story — homepage spotlight for FindBack PH's trademark feature:
 * the hashed ownership-verification challenge that gates every handover.
 *
 * Server component (no client JS) — pure content, rendered inside the page's
 * reveal animations. Kept separate from page.tsx to keep the homepage readable.
 */
export function SafetyStory() {
  const steps = [
    {
      icon: Lock,
      title: "Owner sets a secret challenge",
      body: "When you report an item, you add 1–2 questions only the true owner could answer. Answers are SHA-256 hashed before they ever touch the database, so even we can't read them back.",
    },
    {
      icon: KeyRound,
      title: "Claimant must prove it",
      body: "Before any handover details or contact information are revealed, the person claiming the item has to answer the challenge correctly. Scammers can't fake what they don't know.",
    },
    {
      icon: ShieldCheck,
      title: "Safe, verified handover",
      body: "Once verified, you coordinate the return through in-app messaging — keeping your phone number and address private until you're ready.",
    },
  ];

  return (
    <section className="px-4 pb-16 pt-4 sm:px-6 sm:pb-20" aria-labelledby="safety-story-heading">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-electric-100/80 bg-gradient-to-br from-white via-white to-electric-50/60 p-6 shadow-soft sm:p-10">
            <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-electric-50 blur-3xl" />

            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-electric-200 bg-electric-50 px-3 py-1 text-xs font-semibold text-electric-700">
                <Sparkles size={13} />
                Only on FindBack PH
              </span>

              <h2
                id="safety-story-heading"
                className="mt-4 font-display text-2xl font-bold text-navy-900 sm:text-3xl"
              >
                Items only ever return to their <span className="text-electric-600">true owners</span>
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Anyone can <em>claim</em> a lost wallet. Our hashed ownership-verification
                challenge makes sure only the real owner <em>receives</em> it: the
                anti-scam layer that Facebook groups and classifieds don&apos;t have.
              </p>

              <ol className="mt-8 grid gap-4 sm:grid-cols-3">
                {steps.map((step, index) => (
                  <li
                    key={step.title}
                    className="rounded-2xl border border-slate-200/80 bg-white/80 p-5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-electric-200 bg-electric-50 text-electric-700">
                        <step.icon size={18} />
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Step {index + 1}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-sm font-semibold text-navy-900">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      {step.body}
                    </p>
                  </li>
                ))}
              </ol>

              <div className="mt-8 flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/safety"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-electric-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-electric-500"
                >
                  <ShieldCheck size={15} />
                  How we keep returns safe
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-navy-900 transition hover:bg-slate-50"
                >
                  See how matching works
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
