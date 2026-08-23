import { Loader2 } from "lucide-react";

const SIZES = {
  sm: "h-3.5 w-3.5",
  md: "h-6 w-6",
  lg: "h-9 w-9",
} as const;

export function Spinner({
  size = "md",
  className = "",
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <Loader2
      className={`animate-spin text-emerald-600 ${SIZES[size]} ${className}`}
      aria-label="Loading"
    />
  );
}
