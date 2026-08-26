import Link from "next/link";
import { clsx } from "clsx";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={clsx("inline-flex h-9 w-9 shrink-0 items-center justify-center", className)}
      aria-hidden="true"
    >
      <img
        src="/brand/findback-logo.png"
        alt=""
        className="h-full w-full object-contain"
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
