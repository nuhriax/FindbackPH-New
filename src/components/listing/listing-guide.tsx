import { FilePlus2, HeartHandshake, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT, type Accent } from "./accents";

type GuideStep = {
  icon: React.ElementType;
  title: string;
  caption: string;
};

/**
 * Compact "How FindBack works" strip shared by the Lost / Found listing pages.
 * Three accent-colored steps with connector lines form an explicit content
 * rhythm between the search filters and the results grid.
 */
export function ListingGuide({ accent }: { accent: Accent }) {
  const a = ACCENT[accent];

  const steps: GuideStep[] = [
    {
      icon: FilePlus2,
      title: "Post a report",
      caption:
        "Add the item details, a photo, and where it happened — it takes under a minute.",
    },
    {
      icon: Sparkles,
      title: "Get matched",
      caption:
        "Our engine compares category, location, dates, and description to surface matches.",
    },
    {
      icon: HeartHandshake,
      title: "Reunite safely",
      caption:
        "Connect with a verified community member and hand the item back confidentially.",
    },
  ];

  return (
    <section aria-label="How it works" className="mt-10">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl border",
            a.border,
            a.bgSoft,
            a.text,
          )}
        >
          <HeartHandshake aria-hidden="true" className="h-[18px] w-[18px]" />
        </span>
        <h2 className="text-lg font-semibold tracking-tight">
          How it works
        </h2>
      </div>

      <ol className="mt-5 grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-stretch gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-white shadow-sm",
                  a.border,
                  a.text,
                )}
              >
                <step.icon aria-hidden="true" className="h-5 w-5" />
              </span>
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="mt-1 hidden h-full w-px bg-gradient-to-b from-slate-200 to-transparent md:block"
                />
              )}
            </div>

            <div className="pb-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                <span className={cn("font-mono text-xs", a.textStrong)}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-base">{step.title}</span>
              </p>
              <p className="mt-1.5 text-[13px] leading-6 text-slate-500">
                {step.caption}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}