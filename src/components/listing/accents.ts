export type Accent = "lost" | "found";

export type AccentClasses = {
  text: string;
  textStrong: string;
  border: string;
  bgSoft: string;
  button: string;
  buttonHover: string;
  focus: string;
  hoverText: string;
  glow: string;
};

/**
 * Accent color class maps shared by every listing surface so the Lost Items
 * (blue/indigo) and Found Items (emerald/teal) pages stay two variations of
 * the same product.
 */
export const ACCENT: Record<Accent, AccentClasses> = {
  lost: {
    text: "text-sunrise-700",
    textStrong: "text-sunrise-600",
    border: "border-sunrise-200/80",
    bgSoft: "bg-sunrise-50/80",
    button: "bg-sunrise-500",
    buttonHover: "hover:bg-sunrise-400",
    focus: "focus:border-sunrise-400 focus:ring-sunrise-500/20",
    hoverText: "group-hover:text-sunrise-700",
    glow: "bg-sunrise-500/10",
  },
  found: {
    text: "text-emerald-700",
    textStrong: "text-emerald-600",
    border: "border-emerald-200/80",
    bgSoft: "bg-emerald-50/80",
    button: "bg-emerald-500",
    buttonHover: "hover:bg-emerald-400",
    focus: "focus:border-emerald-400 focus:ring-emerald-500/20",
    hoverText: "group-hover:text-emerald-700",
    glow: "bg-emerald-500/10",
  },
};
