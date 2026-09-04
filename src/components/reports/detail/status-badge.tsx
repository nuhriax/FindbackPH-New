/* ============================================================
   STATUS BADGE
============================================================ */

export function StatusBadge({
  kind,
  status,
}: {
  kind: "lost" | "found";
  status: string;
}) {
  const isLost = kind === "lost";

  const active =
    status === "active" ||
    status === "matched";

  let label: string;

  if (status === "recovered") {
    label = "Recovered";
  } else if (status === "matched") {
    label = "Matched";
  } else if (isLost) {
    label = active
      ? "Still missing"
      : "Not active";
  } else {
    label = active
      ? "Awaiting owner"
      : "Not active";
  }

  const dotColor = isLost
    ? active
      ? "bg-red-500"
      : "bg-slate-400"
    : active
      ? "bg-emerald-500"
      : "bg-slate-400";

  const textColor = isLost
    ? active
      ? "text-red-700"
      : "text-slate-500"
    : active
      ? "text-emerald-700"
      : "text-slate-500";

  return (
    <span
      className="
        status-chip
        inline-flex
        items-center
        gap-2
        rounded-full
        border
        border-white/80
        bg-white/95
        px-4
        py-2
        text-xs
        font-semibold
        shadow-sm
        backdrop-blur
      "
    >
      <span className={`h-2 w-2 rounded-full ${dotColor}`} />

      <span className={textColor}>
        {label}
      </span>
    </span>
  );
}
