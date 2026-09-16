"use client";

import dynamic from "next/dynamic";

// Client-only mount for the decorative marketing background. ssr:false must
// live in a Client Component (Next forbids it directly in a Server Component
// like the root layout). SuloBackground itself has no hooks, so once mounted
// it paints instantly — no mounted-gate, no flash.
const ClientOnlyBackground = dynamic(
  () =>
    import("@/components/ui/marketing-background").then(
      (m) => m.MarketingBackground
    ),
  { ssr: false }
);

export function MarketingBackgroundLazy() {
  return <ClientOnlyBackground />;
}
