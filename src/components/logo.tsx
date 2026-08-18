import Link from "next/link";
import { Radar } from "lucide-react";
import { clsx } from "clsx";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-xl",
        "border border-blue-200 bg-gradient-to-br from-white to-blue-50",
        "shadow-[0_0_0_1px_rgba(59,130,246,0.08),0_8px_22px_-10px_rgba(37,99,235,0.55)]",
        className
      )}
      aria-hidden="true"
    >
      <Radar size={20} className="text-blue-600" strokeWidth={2} />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={clsx("group inline-flex items-center gap-2.5", className)}>
      <LogoMark className="transition-transform duration-200 group-hover:scale-105" />
      <span className="font-display text-lg font-bold tracking-tight text-navy-900">
        FindBack <span className="text-blue-600">PH</span>
      </span>
    </Link>
  );
}

