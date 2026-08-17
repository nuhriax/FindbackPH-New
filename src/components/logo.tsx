import Link from "next/link";
import { Radar } from "lucide-react";
import { clsx } from "clsx";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-xl",
        "border border-electric-500/30 bg-gradient-to-br from-electric-500/25 to-navy-800",
        "shadow-[0_0_24px_rgba(59,130,246,0.35)]",
        className
      )}
      aria-hidden="true"
    >
      <Radar size={20} className="text-electric-300" strokeWidth={2} />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={clsx("group inline-flex items-center gap-2.5", className)}>
      <LogoMark className="transition-transform duration-200 group-hover:scale-105" />
      <span className="font-display text-lg font-bold tracking-tight">
        FindBack <span className="text-electric-400">PH</span>
      </span>
    </Link>
  );
}
