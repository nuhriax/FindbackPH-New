import Link from "next/link";
import { clsx } from "clsx";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-xl",
        "border border-electric-200 bg-gradient-to-br from-white to-electric-50",
        "shadow-[0_0_0_1px_rgba(15,123,122,0.10),0_8px_22px_-10px_rgba(15,123,122,0.5)]",
        className
      )}
      aria-hidden="true"
    >
      {/* Philippine sun + magnifying glass — FindBack PH mark */}
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-sunrise-500">
          <path d="M12 2.5v2.4" /><path d="M12 19.1v2.4" />
          <path d="M2.5 12h2.4" /><path d="M19.1 12h2.4" />
          <path d="M5.3 5.3l1.7 1.7" /><path d="M17 17l1.7 1.7" />
          <path d="M5.3 18.7L7 17" /><path d="M17 7l1.7-1.7" />
        </g>
        <circle cx="11.2" cy="11.2" r="4.6" className="text-electric-600" strokeWidth="2.2" />
        <path d="M14.7 14.7L20 20" className="text-electric-600" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
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
  const brandClass =
    variant === "light"
      ? "text-white"
      : "text-navy-900";
  const accentClass =
    variant === "light" ? "text-electric-300" : "text-electric-600";

  return (
    <Link href="/" className={clsx("group inline-flex items-center gap-2.5", className)}>
      <LogoMark className="transition-transform duration-200 group-hover:scale-105" />
      <span className={clsx("font-display text-lg font-bold tracking-tight", brandClass)}>
        FindBack <span className={accentClass}>PH</span>
      </span>
    </Link>
  );
}

