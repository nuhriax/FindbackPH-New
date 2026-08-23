import { CheckCircle2 } from "lucide-react";

/**
 * Shared presentational building blocks for the Lost / Found item detail
 * pages. Keeping them in one place guarantees that both page designs stay
 * perfectly in sync.
 */

export function Badge({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-2xs">
      {Icon && <Icon size={13} className="text-slate-400" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function StatusBadge({
  returned,
  urgent = false,
  children,
}: {
  returned: boolean;
  /** For lost items still missing — uses a red "urgent" tone instead of green. */
  urgent?: boolean;
  children: React.ReactNode;
}) {
  const activeTone = urgent
    ? "bg-red-50 text-red-700 ring-1 ring-red-200"
    : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  const dotTone = urgent ? "bg-red-500 animate-pulse" : returned ? "bg-slate-400" : "bg-emerald-500 animate-pulse";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        returned
          ? "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
          : activeTone
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${dotTone}`} aria-hidden="true" />
      {children}
    </span>
  );
}

export function DetailBlock({
  label,
  value,
  bordered = false,
}: {
  label: string;
  value?: string | null;
  bordered?: boolean;
}) {
  return (
    <div
      className={bordered ? "border-slate-100 lg:border-l lg:pl-6" : undefined}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-slate-700">
        {value?.trim() || "No information provided."}
      </p>
    </div>
  );
}

export function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

export function ReturnProgress({ returned }: { returned: boolean }) {
  return (
    <div
      className="relative my-4"
      aria-label={
        returned
          ? "Item has been returned to its owner"
          : "Item is currently being matched with its owner"
      }
    >
      <div className="absolute left-[12%] right-[12%] top-4 h-1 rounded-full bg-slate-100" />

      <div
        className={`absolute left-[12%] top-4 h-1 rounded-full bg-emerald-500 transition-all duration-300 ${
          returned ? "right-[12%]" : "w-[38%]"
        }`}
      />

      <ol className="relative grid grid-cols-3">
        <ProgressStep
          number="1"
          title="Reported"
          description={
            returned
              ? "Item was reported on FindBack PH"
              : "Item was lost and reported"
          }
          state="complete"
        />

        <ProgressStep
          number="2"
          title={returned ? "Matched" : "Matching"}
          description={
            returned
              ? "Possible owner identified"
              : "Connecting with potential finders"
          }
          state={returned ? "complete" : "current"}
          centered
        />

        <ProgressStep
          number="3"
          title="Returned"
          description="Handed over to verified owner"
          state={returned ? "complete" : "pending"}
          right
        />
      </ol>
    </div>
  );
}

export function ProgressStep({
  number,
  title,
  description,
  state,
  centered = false,
  right = false,
}: {
  number: string;
  title: string;
  description: string;
  state: "complete" | "current" | "pending";
  centered?: boolean;
  right?: boolean;
}) {
  const isComplete = state === "complete";
  const isCurrent = state === "current";

  return (
    <li
      className={centered ? "text-center" : right ? "text-right" : "text-left"}
      aria-current={isCurrent ? "step" : undefined}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
          isComplete
            ? "bg-emerald-600 text-white"
            : isCurrent
            ? "border-2 border-emerald-600 bg-white text-emerald-700 ring-4 ring-emerald-50"
            : "border-2 border-slate-300 bg-white text-slate-400"
        } ${centered ? "mx-auto" : ""} ${right ? "ml-auto" : ""}`}
      >
        {isComplete ? <CheckCircle2 size={16} aria-hidden="true" /> : number}
      </div>

      <p
        className={`mt-2.5 text-xs font-bold ${
          isComplete || isCurrent ? "text-slate-900" : "text-slate-500"
        }`}
      >
        {title}
      </p>

      <p
        className={`mt-0.5 text-[11px] leading-relaxed text-slate-500 ${
          centered ? "mx-auto" : ""
        } ${right ? "ml-auto" : ""} max-w-[130px]`}
      >
        {description}
      </p>
    </li>
  );
}
