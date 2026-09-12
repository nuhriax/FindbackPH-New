"use client";

import { useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";

export function LogoMark({ className }: { className?: string }) {
  // Original crest (sun + magnifier + palms + stars). Rendered raw — no
  // tile, ring, or background — so the artwork's own shape shows.
  // Slightly larger than the old 36px tile so detail stays legible.
  const [missing, setMissing] = useState(false);
  const src = missing ? "/brand/findback-logo.svg" : "/brand/original-logo.png";
  return (
    <span
      className={clsx(
        "logo-mark inline-flex h-11 w-11 shrink-0 items-center justify-center",
        className,
      )}
      aria-hidden="true"
    >
      <img
        src={src}
        alt=""
        width={44}
        height={44}
        className="h-full w-full object-contain drop-shadow-[0_2px_6px_rgba(5,42,51,0.25)]"
        loading="eager"
        onError={() => setMissing(true)}
      />
    </span>
  );
}

export function Logo({
  className,
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const brandClass = variant === "light" ? "text-white" : "text-navy-900";
  const accentClass = variant === "light" ? "text-electric-300" : "text-electric-600";

  return (
    <Link href="/" className={clsx("group inline-flex items-center gap-2.5", className)}>
      <LogoMark className="transition-transform duration-200 group-hover:scale-105" />
      <span className={clsx("font-display text-lg font-bold tracking-tight", brandClass)}>
        FindBack <span className={accentClass}>PH</span>
      </span>
    </Link>
  );
}
