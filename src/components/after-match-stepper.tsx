"use client";

import { useState } from "react";
import {
  BadgeCheck,
  CheckCircle,
  MapPin,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { clsx } from "clsx";

type Step = {
  icon: LucideIcon;
  title: string;
  text: string;
};

const steps: Step[] = [
  {
    icon: MessageCircle,
    title: "You message each other privately",
    text: "All chats live inside FindBack — no need to exchange phone numbers or emails.",
  },
  {
    icon: BadgeCheck,
    title: "Ownership is confirmed with details",
    text: "The claimant describes identifying marks or contents that never appeared in the public report.",
  },
  {
    icon: MapPin,
    title: "You agree on a safe, public meeting spot",
    text: "Busy malls, stations, or barangay halls work well. Tell someone you trust about the plan.",
  },
  {
    icon: CheckCircle,
    title: "The handover happens, and the report is closed",
    text: "Either side marks the report as recovered, closing the loop for the whole community.",
  },
];

/**
 * Interactive horizontal stepper for "What happens after a match?".
 * Every step's text stays visible; selecting a step highlights it and
 * fills the connector line up to that point.
 */
export function AfterMatchStepper() {
  const [active, setActive] = useState(0);

  return (
    <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, i) => {
        const isActive = active === i;
        return (
          <li
            key={step.title}
            className="relative flex flex-col items-center text-center"
          >
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={clsx(
                  "absolute left-1/2 top-5 hidden h-0.5 w-full transition-colors duration-500 lg:block",
                  i < active ? "bg-electric-500" : "bg-electric-100",
                )}
              />
            )}
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={isActive}
              className="group relative z-10 flex w-full flex-col items-center rounded-2xl px-2 py-3 transition-transform duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-500/40 hover:-translate-y-1"
            >
              <span
                className={clsx(
                  "flex h-12 w-12 items-center justify-center rounded-full shadow-sm ring-4 ring-white transition-all duration-300",
                  isActive
                    ? "scale-110 bg-electric-600 text-white"
                    : "bg-electric-50 text-electric-600 ring-electric-100 group-hover:bg-electric-600 group-hover:text-white",
                )}
              >
                <step.icon aria-hidden="true" size={19} />
              </span>
              <h3
                className={clsx(
                  "mt-3 text-sm font-semibold transition-colors",
                  isActive ? "text-electric-700" : "text-navy-900",
                )}
              >
                {step.title}
              </h3>
              <p className="mt-1.5 text-xs leading-6 text-slate-600">
                {step.text}
              </p>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
