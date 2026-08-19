import Link from "next/link";
import { Radar } from "lucide-react";
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
      <Radar size={20} className="text-electric-600" strokeWidth={2} />
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

