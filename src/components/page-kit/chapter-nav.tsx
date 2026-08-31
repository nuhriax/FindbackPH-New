import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

/**
 * ChapterNav — the thread that ties the three "chapters" of the site
 * (How It Works / Safety / About) together. Each page renders it with its
 * own chapter number so visitors feel they're moving through one story,
 * not three isolated pages.
 */

const CHAPTERS = [
  {
    n: "01",
    href: "/how-it-works",
    label: "The Journey",
    blurb: "How a report becomes a reunion",
  },
  {
    n: "02",
    href: "/safety",
    label: "The Field Manual",
    blurb: "How you stay safe at every step",
  },
  {
    n: "03",
    href: "/about",
    label: "The Manifesto",
    blurb: "Why FindBack PH exists",
  },
] as const;

export function ChapterNav({
  current,
  tone = "light",
}: {
  current: "how-it-works" | "safety" | "about";
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";
  const idx = CHAPTERS.findIndex((c) => c.href === `/${current}`);
  const next = CHAPTERS[(idx + 1) % CHAPTERS.length];

  return (
    <nav
      aria-label="Site chapters"
      className={`rounded-3xl border p-5 sm:p-6 ${
        isDark
          ? "border-white/10 bg-white/[0.04]"
          : "border-slate-200/70 bg-white/80 shadow-soft"
      }`}
    >
      <p
        className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${
          isDark ? "text-white/50" : "text-slate-500"
        }`}
      >
        <BookOpen aria-hidden="true" size={13} />
        The FindBack chapters · {CHAPTERS[idx].label}
      </p>

      <ol className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
        {CHAPTERS.map((c) => {
          const active = c.href === `/${current}`;
          return (
            <li key={c.n} className="flex-1">
              <Link
                href={c.href}
                aria-current={active ? "page" : undefined}
                className={`group flex h-full items-center gap-3 rounded-2xl px-4 py-3 transition ${
                  active
                    ? isDark
                      ? "bg-teal-400/10 ring-1 ring-teal-300/30"
                      : "bg-electric-50 ring-1 ring-electric-200"
                    : isDark
                      ? "hover:bg-white/5"
                      : "hover:bg-slate-50"
                }`}
              >
                <span
                  className={`font-display text-sm font-bold ${
                    active
                      ? isDark
                        ? "text-teal-300"
                        : "text-electric-700"
                      : isDark
                        ? "text-white/40"
                        : "text-slate-400"
                  }`}
                >
                  {c.n}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-sm font-semibold ${
                      active
                        ? isDark
                          ? "text-white"
                          : "text-navy-900"
                        : isDark
                          ? "text-white/70"
                          : "text-slate-600"
                    }`}
                  >
                    {c.label}
                  </span>
                  <span
                    className={`block truncate text-xs ${
                      isDark ? "text-white/40" : "text-slate-400"
                    }`}
                  >
                    {c.blurb}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {/* Continue reading → the next chapter of the story */}
      <Link
        href={next.href}
        className={`group mt-4 inline-flex items-center gap-1.5 text-sm font-medium ${
          isDark
            ? "text-teal-300 hover:text-teal-200"
            : "text-electric-700 hover:text-electric-600"
        }`}
      >
        Continue to Chapter {next.n} — {next.label}
        <ArrowRight
          aria-hidden="true"
          size={15}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </nav>
  );
}
