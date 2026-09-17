"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, RotateCcw, X } from "lucide-react";

/**
 * DemoBar — minimal presentation control for the FindBackPH launch demo.
 * Fixed to the bottom of the viewport, rendered ONLY in demo mode and only
 * on routes that are part of the demo flow. On every other page it renders
 * nothing, so the real website stays untouched for ordinary visitors.
 */

type Scene = { label: string; href: string };

const SCENES: Scene[] = [
  { label: "Intro", href: "/demo" },
  { label: "Search", href: "/demo/discover?q=iphone" },
  { label: "Community feed", href: "/demo/discover" },
  { label: "Report lost", href: "/report/lost" },
  { label: "Report found", href: "/report/found" },
  { label: "Safety", href: "/safety" },
  { label: "Closing", href: "/demo?scene=closing" },
];

/** Demo-bar routes: demo pages + the real pages featured in the flow. */
const SCENE_PATHS = ["/demo", "/report/lost", "/report/found", "/safety"];

export function DemoBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const demoRoutes = ["/demo", "/demo/discover", "/demo/lost", "/demo/found"];
  const isSceneRoute = SCENE_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isDemoRoute = demoRoutes.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!isSceneRoute && !isDemoRoute) return null;

  // Which scene is active? A scene matches on path (+ query for the search
  // scene). Detail demo pages count as "Community feed" territory.
  const activeIndex = (() => {
    if (pathname.startsWith("/demo/lost/") || pathname.startsWith("/demo/found/"))
      return 2;
    const q = searchParams.get("q") ?? "";
    for (let i = SCENES.length - 1; i >= 0; i--) {
      const [path, search] = SCENES[i].href.split("?");
      if (pathname !== path) continue;
      if (!search) return q ? -1 : i;
      const want = new URLSearchParams(search);
      if (
        want.get("q") === q &&
        want.get("scene") === searchParams.get("scene")
      )
        return i;
    }
    return -1;
  })();

  return (
    <div
      className="
        fixed inset-x-0 bottom-3 z-[70] flex justify-center px-3
        print:hidden
      "
      role="navigation"
      aria-label="Demo controls"
    >
      <div
        className="
          flex items-center gap-1 rounded-full border border-ink/15
          bg-ink/95 py-1.5 pl-4 pr-1.5 text-white shadow-lg backdrop-blur
        "
      >
        <span className="mr-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-sun-300">
          <span className="h-1.5 w-1.5 rounded-full bg-sun-400" />
          Demo
        </span>

        {activeIndex > 0 ? (
          <Link
            href={SCENES[activeIndex - 1].href}
            aria-label={`Previous scene: ${SCENES[activeIndex - 1].label}`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft size={16} aria-hidden />
          </Link>
        ) : (
          <span aria-hidden className="flex h-8 w-8 items-center justify-center opacity-30">
            <ChevronLeft size={16} />
          </span>
        )}

        <span className="min-w-[7.5rem] text-center text-xs font-semibold text-white/90 sm:min-w-[10rem]">
          {activeIndex >= 0
            ? `${activeIndex + 1}/7 · ${SCENES[activeIndex].label}`
            : "Sample data — not live reports"}
        </span>

        {activeIndex >= 0 && activeIndex < SCENES.length - 1 ? (
          <Link
            href={SCENES[activeIndex + 1].href}
            aria-label={`Next scene: ${SCENES[activeIndex + 1].label}`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <ChevronRight size={16} aria-hidden />
          </Link>
        ) : (
          <span aria-hidden className="flex h-8 w-8 items-center justify-center opacity-30">
            <ChevronRight size={16} />
          </span>
        )}

        <Link
          href="/demo"
          aria-label="Reset demo"
          title="Reset demo"
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <RotateCcw size={14} aria-hidden />
        </Link>
        <Link
          href="/"
          aria-label="Exit demo — go to the real site"
          title="Exit demo"
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <X size={14} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
