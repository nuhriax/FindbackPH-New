import { CATEGORY_LABELS } from "@/lib/validation";

/* ============================================================
   MATCH INFO
============================================================ */

export function getMatchInfo(score: number | null) {
  if (score == null) {
    return {
      label: "Possible",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (score >= 0.75) {
    return {
      label: "Strong",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (score >= 0.6) {
    return {
      label: "Possible",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Low",
    className:
      "border-slate-200 bg-slate-100 text-slate-600",
  };
}

/** Resolve a category key to its display label, falling back to the raw key. */
export function categoryLabelOf(category: string) {
  return (
    CATEGORY_LABELS[
      category as keyof typeof CATEGORY_LABELS
    ] ?? category
  );
}
