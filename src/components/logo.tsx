import Link from "next/link";
import { clsx } from "clsx";

/**
 * FindBack PH brand mark — Philippine sun (gold rays) behind a magnifying
 * glass whose lens holds a tropical scene (palm, baroque church, star, waves),
 * with ocean swooshes below. Matches the official brand logo.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={clsx("h-10 w-10", className)}
      role="img"
      aria-label="FindBack PH logo"
      fill="none"
    >
      <defs>
        <clipPath id="fb-lens">
          <circle cx="27" cy="27" r="11.5" />
        </clipPath>
        <linearGradient id="fb-wave" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#17B3AC" />
          <stop offset="1" stopColor="#0C7C7C" />
        </linearGradient>
      </defs>

      {/* Philippine sun — 8 tapered gold rays */}
      <g fill="#F5B301">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <path key={a} d="M27 1.5 L29.4 11 L24.6 11 Z" transform={`rotate(${a} 27 27)`} />
        ))}
      </g>

      {/* Magnifying glass ring + dark lens */}
      <circle cx="27" cy="27" r="15" fill="#0A2F3C" stroke="#17A398" strokeWidth="5" />
      <circle cx="27" cy="27" r="11.5" stroke="#E8F6F5" strokeWidth="1" opacity="0.45" />

      {/* Tropical scene inside the lens */}
      <g clipPath="url(#fb-lens)">
        {/* palm tree */}
        <path
          d="M21.5 37 C21.5 31 22.3 27.5 23.5 25.5"
          stroke="#7FD8D2"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <g stroke="#7FD8D2" strokeWidth="1.5" strokeLinecap="round" fill="none">
          <path d="M23.5 25.5 C20.5 24 18 24.5 16.5 26.5" />
          <path d="M23.5 25.5 C21.5 22.5 19 22 17 23.5" />
          <path d="M23.5 25.5 C24.5 22 27 20.5 29.5 21.5" />
          <path d="M23.5 25.5 C26.5 24.5 29 25.5 30.5 28" />
        </g>
        {/* baroque church */}
        <g fill="#F5B301">
          <rect x="28.5" y="29.5" width="6" height="6.5" rx="0.6" />
          <path d="M28.5 29.5 L31.5 25.5 L34.5 29.5 Z" />
          <path d="M31.5 24 v1.6 M30.7 24.8 h1.6" stroke="#F5B301" strokeWidth="0.8" />
        </g>
        {/* star */}
        <path
          d="M33.5 20.5 l0.9 1.8 2 0.3 -1.45 1.4 0.35 2 -1.8 -0.95 -1.8 0.95 0.35 -2 -1.45 -1.4 2 -0.3 Z"
          fill="#F5B301"
        />
        {/* waves inside lens */}
        <path
          d="M15.5 34 C18.5 32.5 21 33.5 23.5 35 C26 36.5 29 36.5 31.5 35 L38.5 35 L38.5 38.5 L15.5 38.5 Z"
          fill="#12807E"
          opacity="0.9"
        />
      </g>

      {/* handle */}
      <path d="M38.5 38.5 L50.5 50.5" stroke="#17A398" strokeWidth="7.5" strokeLinecap="round" />
      <path d="M40 40 L48 48" stroke="#5FD0C8" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

      {/* ocean swooshes */}
      <path
        d="M2 52 C10 45 22 45.5 32 49 C42 52.5 52 51.5 60 47 L60 56 C50 61 38 61.5 28 57.5 C18 53.5 9 54.5 2 58 Z"
        fill="url(#fb-wave)"
      />
      <path
        d="M6 60 C13 55.5 22 55.8 30 58.5 C38 61.2 48 60.8 56 57.5 L56 61.5 C47 64.8 37 65 29 62.2 C21 59.4 12.5 59.8 6 62.5 Z"
        fill="#0C7C7C"
        opacity="0.85"
      />
    </svg>
  );
}

export function Logo({
  className,
  variant = "dark",
  showTagline = false,
}: {
  className?: string;
  variant?: "dark" | "light";
  showTagline?: boolean;
}) {
  const brandClass = variant === "light" ? "text-white" : "text-navy-900";
  const accentClass = variant === "light" ? "text-electric-300" : "text-electric-600";

  return (
    <Link href="/" className={clsx("group inline-flex items-center gap-2.5", className)}>
      <LogoMark className="transition-transform duration-200 group-hover:scale-105" />
      <span className="flex flex-col">
        <span className={clsx("font-display text-lg font-extrabold leading-none tracking-tight", brandClass)}>
          FindBack<span className={accentClass}>PH</span>
          <span className="ml-1.5 inline-flex -translate-y-px items-center rounded-md bg-gradient-to-r from-electric-500 to-electric-600 px-1.5 py-0.5 align-middle text-[10px] font-bold leading-none text-white shadow-sm">
            .me
          </span>
        </span>
        {showTagline && (
          <span className="mt-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em]">
            <span aria-hidden="true" className="h-px w-3 bg-sunrise-500" />
            <span className="text-electric-600">
              Lost today. <span className="text-sunrise-500">Found tomorrow.</span>
            </span>
            <span aria-hidden="true" className="h-px w-3 bg-sunrise-500" />
          </span>
        )}
      </span>
    </Link>
  );
}


