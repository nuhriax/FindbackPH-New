"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, HeartHandshake } from "lucide-react";
import { MotionReveal } from "@/components/motion-kit";

/**
 * SignalFlipper — Safety chapter, section 02.
 * One deck of situations that reads as red flags or green lights depending
 * on which side the visitor flips to. Teaching safety by contrast.
 */

type Signal = "flags" | "lights";

const SIGNALS: Record<
  Signal,
  { items: { signal: string; meaning: string }[] }
> = {
  flags: {
    items: [
      {
        signal: "\u201cPay a release fee first\u201d",
        meaning: "FindBack never charges to return an item. This is a scam — walk away.",
      },
      {
        signal: "\u201cMove to Viber/Messenger now\u201d",
        meaning: "Leaving the app removes the record that protects you both.",
      },
      {
        signal: "Urgency and secrecy",
        meaning: "\u201cAct now, tell no one\u201d is pressure, not urgency. A genuine return can wait.",
      },
      {
        signal: "Can't describe the item",
        meaning: "Vague answers to specific questions mean the item isn't theirs.",
      },
    ],
  },
  lights: {
    items: [
      {
        signal: "Detailed, unprompted answers",
        meaning: "They mention contents, scratches, and stickers without being asked.",
      },
      {
        signal: "Happy to chat in FindBack",
        meaning: "Nothing to hide stays nothing to hide — in the app, on the record.",
      },
      {
        signal: "Passes your ownership challenge",
        meaning: "The secret question you set did its job. That's proof, not luck.",
      },
      {
        signal: "Suggests a public place",
        meaning: "A mall, a barangay hall, a busy cafe — finders who mean well aren't hard to meet.",
      },
    ],
  },
};



export function SignalFlipper() {
  const [signal, setSignal] = useState<Signal>("flags");
  const active = SIGNALS[signal];
  const isFlags = signal === "flags";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col items-center gap-3">
        <div
          role="tablist"
          aria-label="Flip between red flags and green lights"
          className="inline-flex rounded-full border border-slate-200 bg-white/85 p-1.5 shadow-soft backdrop-blur"
        >
          {(Object.keys(SIGNALS) as Signal[]).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={signal === s}
              onClick={() => setSignal(s)}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 sm:px-7 ${
                signal === s
                  ? s === "flags"
                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/30"
                    : "bg-leaf-600 text-white shadow-md shadow-leaf-600/30"
                  : "text-slate-500 hover:text-navy-800"
              }`}
            >
              {s === "flags" ? (
                <>
                  <AlertTriangle size={15} aria-hidden="true" /> Red flags
                </>
              ) : (
                <>
                  <HeartHandshake size={15} aria-hidden="true" /> Green lights
                </>
              )}
            </button>
          ))}
        </div>
        <p className="max-w-md text-center text-xs leading-6 text-slate-500">
          Flip between the two and learn to read a conversation like a pro.
        </p>
      </div>

      <MotionReveal
        key={signal}
        direction="blur"
        className="mt-8 grid gap-4 sm:grid-cols-2"
      >
        {active.items.map((item) => (
          <div
            key={item.signal}
            className={`rounded-3xl border bg-white/85 p-5 shadow-soft backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card sm:p-6 ${
              isFlags ? "border-rose-100 hover:border-rose-300" : "border-leaf-100 hover:border-leaf-300"
            }`}
          >
            <div className="flex items-start gap-3.5">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${
                  isFlags ? "bg-rose-500" : "bg-leaf-600"
                }`}
              >
                {isFlags ? (
                  <AlertTriangle size={16} aria-hidden="true" />
                ) : (
                  <CheckCircle2 size={16} aria-hidden="true" />
                )}
              </span>
              <div>
                <h3 className="font-display text-sm font-bold text-navy-900">
                  {item.signal}
                </h3>
                <p className="mt-1.5 text-xs leading-6 text-slate-600 sm:text-sm">
                  {item.meaning}
                </p>
              </div>
            </div>
          </div>
        ))}
      </MotionReveal>
    </div>
  );
}
