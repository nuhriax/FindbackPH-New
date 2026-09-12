export type Accent = "lost" | "found" | "discover" | "reunited";

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
 * Accent color class maps shared by every listing surface. Lost wears coral
 * (the "missing" signal), Found wears ocean blue, and Reunited celebrates
 * in sun gold. Deprecated aliases (sunrise/sulo/teal) resolve to these same
 * brand values — new call sites should use the semantic tokens directly.
 */
export const ACCENT: Record<Accent, AccentClasses> = {
  lost: {
    text: "text-coral-700",
    textStrong: "text-coral-600",
    border: "border-coral-200/80",
    bgSoft: "bg-coral-50/80",
    button: "bg-coral-500",
    buttonHover: "hover:bg-coral-400",
    focus: "focus:border-coral-400 focus:ring-coral-500/20",
    hoverText: "group-hover:text-coral-700",
    glow: "bg-coral-500/10",
  },
  found: {
    text: "text-ocean-700",
    textStrong: "text-ocean-600",
    border: "border-ocean-200/80",
    bgSoft: "bg-ocean-50/80",
    button: "bg-ocean-600",
    buttonHover: "hover:bg-ocean-500",
    focus: "focus:border-ocean-400 focus:ring-ocean-500/20",
    hoverText: "group-hover:text-ocean-700",
    glow: "bg-ocean-500/10",
  },
  /** Discover — the mixed lost+found feed wears the brand ocean. */
  discover: {
    text: "text-ocean-700",
    textStrong: "text-ocean-600",
    border: "border-ocean-200/80",
    bgSoft: "bg-ocean-50/80",
    button: "bg-ocean-700",
    buttonHover: "hover:bg-ocean-600",
    focus: "focus:border-ocean-400 focus:ring-ocean-500/20",
    hoverText: "group-hover:text-ocean-700",
    glow: "bg-ocean-500/10",
  },
  /** Reunited — the celebratory moment wears sun gold. */
  reunited: {
    text: "text-sun-700",
    textStrong: "text-sun-600",
    border: "border-sun-200/80",
    bgSoft: "bg-sun-50/80",
    button: "bg-sun-500",
    buttonHover: "hover:bg-sun-400",
    focus: "focus:border-sun-400 focus:ring-sun-500/20",
    hoverText: "group-hover:text-sun-700",
    glow: "bg-sun-500/10",
  },
};
