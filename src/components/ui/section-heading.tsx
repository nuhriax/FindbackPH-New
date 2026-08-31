import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "./card";

/**
 * FindBack PH — SectionHeading.
 * One consistent heading block for every page section: eyebrow → title → lead.
 * Keeps vertical rhythm and typographic scale identical across the whole site.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2
        className={cn(
          "mt-3 font-display text-3xl font-bold leading-[1.1] tracking-[-0.025em] text-navy-900 sm:text-4xl",
          eyebrow ? undefined : "mt-0"
        )}
      >
        {title}
      </h2>
      {lead && (
        <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">{lead}</p>
      )}
    </div>
  );
}
