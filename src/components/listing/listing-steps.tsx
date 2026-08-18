import { ACCENT, type Accent } from "./accents";

type Step = {
  number: string;
  title: string;
};

/**
 * Numbered "how it works" steps for the Lost/Found listing pages.
 */
export function ListingSteps({
  accent,
  heading,
  steps,
}: {
  accent: Accent;
  heading: string;
  steps: Step[];
}) {
  const a = ACCENT[accent];

  return (
    <section className="mt-14 border-t border-slate-200/70 pt-10">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {heading}
      </h2>

      <ol className="mt-6 grid gap-6 sm:grid-cols-3">
        {steps.map((step) => (
          <li key={step.number} className="flex items-start gap-4">
            <span
              className={`font-display text-2xl font-semibold leading-none ${a.textStrong}`}
            >
              {step.number}
            </span>
            <span className="pt-0.5 text-sm font-medium text-navy-900">
              {step.title}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
