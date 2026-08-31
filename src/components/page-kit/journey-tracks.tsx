"use client";

import { useState } from "react";
import {
  ClipboardList,
  PackageSearch,
  Search,
  Sparkles,
  MessageCircle,
  HandHeart,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { MotionReveal } from "@/components/motion-kit";

/**
 * JourneyTracks — the heart of the How It Works chapter.
 * One timeline, two moods: flip between "I lost something" and
 * "I found something" and the whole story morphs, so a reader instantly
 * finds the path that matches *their* moment.
 */

type Track = "lost" | "found";

const TRACKS: Record<
  Track,
  { icon: typeof Search; title: string; text: string }[]
> = {
  lost: [

    {
      icon: ClipboardList,
      title: "Tell us what's gone",
      text: "Photos, category, the place and day you last had it. Every detail is a clue — and clues bring things home.",
    },
    {
      icon: Search,
      title: "Let the community look",
      text: "Search found reports while we watch for ones that match yours. You are not doing this alone anymore.",
    },
    {
      icon: Sparkles,
      title: "A match finds you",
      text: "When a found report lines up with yours, FindBack puts the two halves together and quietly knocks on your door.",
    },
    {
      icon: CheckCircle,
      title: "Bring it home",
      text: "Chat privately, confirm the identifying details, then meet somewhere busy and public. Welcome it back.",
    },
  ],
  found: [
    {
      icon: PackageSearch,
      title: "Post what you found",
      text: "Enough detail for the true owner to recognize it — but hold back one or two marks only the real owner knows.",
    },
    {
      icon: Search,
      title: "Check for its owner",
      text: "Search lost reports in your area and category. Someone may have already posted, hoping someone like you showed up.",
    },
    {
      icon: MessageCircle,
      title: "Meet the person behind the report",
      text: "Talk in FindBack's private chat. Contact details stay hidden until you decide to share them.",
    },
    {
      icon: HandHeart,
      title: "Hand it back",
      text: "Verify their story, choose a public place, and watch a stranger's whole day turn around because of you.",
    },
  ],
};

const COPY: Record<Track, { chip: string; title: string; sub: string }> = {
  lost: {
    chip: "I lost something",
    title: "The path of the searcher",
    sub: "It's okay. This happens to everyone. Here's exactly what happens next.",
  },
  found: {
    chip: "I found something",
    title: "The path of the finder",
    sub: "You found it — now meet the person who's been looking for it.",
  },
};


export function JourneyTracks() {
  const [track, setTrack] = useState<Track>("lost");
  const copy = COPY[track];
  const steps = TRACKS[track];

  return (
    <div className="mx-auto max-w-5xl">
      {/* The switch — feels like choosing your side of the story */}
      <div className="flex justify-center">
        <div
          role="tablist"
          aria-label="Choose your journey"
          className="inline-flex rounded-full border border-slate-200 bg-white/85 p-1.5 shadow-soft backdrop-blur"
        >
          {(Object.keys(TRACKS) as Track[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={track === t}
              onClick={() => setTrack(t)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 sm:px-7 ${
                track === t
                  ? t === "lost"
                    ? "bg-sunrise-500 text-white shadow-md shadow-sunrise-500/25"
                    : "bg-leaf-600 text-white shadow-md shadow-leaf-600/25"
                  : "text-slate-500 hover:text-navy-800"
              }`}
            >
              {t === "lost" ? (
                <span className="flex items-center gap-2">
                  <Search size={15} aria-hidden="true" /> I lost something
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <HandHeart size={15} aria-hidden="true" /> I found something
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Track intro line — changes with the mood */}
      <MotionReveal key={track} direction="blur" className="mt-8 text-center">
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
            track === "lost" ? "text-sunrise-600" : "text-leaf-600"
          }`}
        >
          {copy.title}
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-600">
          {copy.sub}
        </p>
      </MotionReveal>

      {/* The morphing timeline */}
      <MotionReveal key={`${track}-list`} direction="up" className="relative mt-10">
        {/* the dotted "return path" — the motif that runs through all three pages */}
        <svg
          aria-hidden="true"
          viewBox="0 0 4 100"
          preserveAspectRatio="none"
          className="absolute left-[27px] top-4 hidden h-[calc(100%-3rem)] w-1 sm:block"
        >
          <line
            x1="2"
            y1="0"
            x2="2"
            y2="100"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="1 7"
            strokeLinecap="round"
            className={track === "lost" ? "text-sunrise-300" : "text-leaf-300"}
          />
        </svg>

        <ol className="space-y-5">
          {steps.map((step, i) => (
            <li key={step.title}>
              <div
                className={`group flex gap-4 rounded-3xl border bg-white/85 p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card sm:p-6 ${
                  track === "lost"
                    ? "border-sunrise-100 hover:border-sunrise-300"
                    : "border-leaf-100 hover:border-leaf-300"
                }`}
              >
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${
                      track === "lost"
                        ? "bg-gradient-to-br from-sunrise-400 to-sunrise-600 shadow-sunrise-500/25"
                        : "bg-gradient-to-br from-leaf-400 to-leaf-600 shadow-leaf-500/25"
                    }`}
                  >
                    <step.icon size={22} aria-hidden="true" />
                  </span>
                  <span
                    aria-hidden="true"
                    className={`mt-2 hidden font-display text-xs font-bold sm:block ${
                      track === "lost" ? "text-sunrise-400" : "text-leaf-400"
                    }`}
                  >
                    0{i + 1}
                  </span>
                </div>
                <div className="min-w-0 pt-1">
                  <h3 className="font-display text-base font-bold text-navy-900 sm:text-lg">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-7 text-slate-600">
                    {step.text}
                  </p>
                </div>
                <ArrowRight
                  aria-hidden="true"
                  size={17}
                  className={`ml-auto hidden self-center transition-transform group-hover:translate-x-1 sm:block ${
                    track === "lost" ? "text-sunrise-400" : "text-leaf-400"
                  }`}
                />
              </div>
            </li>
          ))}
        </ol>
      </MotionReveal>
    </div>
  );
}
