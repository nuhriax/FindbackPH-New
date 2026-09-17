import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Hero } from "@/components/home/hero";
import { FeedTabs } from "@/components/home/feed-tabs";
import { ButtonLink } from "@/components/ui/button";
import { notFound } from "next/navigation";
import { DEMO_MODE } from "@/lib/demo/config";
import {
  demoFeedCards,
  demoHeroCards,
} from "@/lib/demo/fixture";

export const metadata = {
  title: { absolute: "FindBack PH — product demo (sample data)" },
  robots: { index: false, follow: false },
};

/**
 * Demo Scene 1 — the real homepage hero with sample reports on the board.
 *
 * Everything on screen is the REAL hero, feed and card components — only the
 * data behind them comes from the clearly-labeled demo fixture (every title
 * starts with "Demo:"). No database is touched. Scene navigation lives in the
 * fixed demo bar; the scene guide below doubles as the closing screen.
 */
export default async function DemoHomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!DEMO_MODE) notFound();

  const sp = await searchParams;
  const closing = sp.scene === "closing";

  const heroCards = demoHeroCards();
  const feedCards = demoFeedCards();

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* 1 — HERO: the real dual-intent hero, sample reports on the board */}
      <Hero totalActive={feedCards.length} recent={heroCards.slice(0, 3)} />

      {/* 2 — LIVE REPORTS: same section as the real homepage, sample data */}
      <section
        id="latest-reports"
        aria-labelledby="latest-reports-heading"
        className="scroll-mt-24 px-4 pb-10 pt-8 sm:px-6 sm:pt-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-electric-600">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Live from the community
              </p>
              <h2
                id="latest-reports-heading"
                className="mt-2 font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl"
              >
                See what needs a way home
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Sample reports for this demo — on the real site, this feed
                updates in real time as people post.
              </p>
            </div>
            <Link
              href="/demo/discover"
              className="group inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-soft transition hover:-translate-y-px hover:border-electric-200 hover:text-electric-700"
            >
              View all reports
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          <div className="mt-7">
            <FeedTabs cards={feedCards} />
          </div>
        </div>
      </section>

      {/* Scene flow guide — presentation aid, also the closing screen. */}
      <DemoGuide closing={closing} />
    </main>
  );
}

/* ============================================================================ */
/* Demo guide — presentation aid; `closing` renders the Scene 7 variant.        */
/* ============================================================================ */

function DemoGuide({ closing }: { closing: boolean }) {
  return (
    <section
      aria-labelledby="demo-guide-heading"
      className="px-4 pb-28 pt-6 sm:px-6"
    >
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-soft backdrop-blur sm:p-8">
          {closing ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-electric-600">
                Thank you
              </p>
              <h2
                id="demo-guide-heading"
                className="mt-2 font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl"
              >
                Every lost thing has a way home.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                FindBack PH is a community platform: report what you lost, post
                what you found, and let matching, private messaging and
                ownership verification handle the rest — no public contact
                details, ever.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <ButtonLink href="/report/lost" variant="primary">
                  Report lost item
                </ButtonLink>
                <ButtonLink href="/report/found" variant="outline">
                  Report found item
                </ButtonLink>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-electric-600">
                Demo guide
              </p>
              <h2
                id="demo-guide-heading"
                className="mt-2 font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl"
              >
                How FindBack PH works
              </h2>
              <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(
                  [
                    ["1", "Search for your item", "Try \u201ciPhone\u201d — matches lost and found reports in one place.", "/demo/discover?q=iphone"],
                    ["2", "Browse the community feed", "All / Lost / Found tabs, filters, and the Philippines map.", "/demo/discover"],
                    ["3", "Report a lost item", "The real wizard: details, photo, review — submitted with your account.", "/report/lost"],
                    ["4", "Report a found item", "Post something you found — safely, with no personal contact details.", "/report/found"],
                    ["5", "Trust & safety", "Ownership verification, private chat, safe meetups, reporting.", "/safety"],
                  ] as const
                ).map(([n, title, desc, href]) => (
                  <li key={n}>
                    <Link
                      href={href}
                      className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition hover:border-electric-200 hover:bg-white"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-electric-600 text-[11px] font-bold text-white">
                        {n}
                      </span>
                      <span className="mt-2.5 text-sm font-bold text-slate-900 group-hover:text-electric-700">
                        {title}
                      </span>
                      <span className="mt-1 text-xs leading-5 text-slate-600">
                        {desc}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
              <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
                Demo mode: all reports on these pages are clearly labeled
                samples. Use the dark bar below to move between scenes — the
                Report and Safety scenes open the real site.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

