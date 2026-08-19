// ---------------------------------------------------------------------------
// PaperNotes
// ---------------------------------------------------------------------------
// Small floating "paper note" decorations (off-white paper, slight rotation,
// push pin, handwritten-style accent) that appear around page edges to add a
// friendly community feel. Purely decorative: aria-hidden + pointer-events-none.
// Hidden on mobile so they never cover content.
// ---------------------------------------------------------------------------

import { cn } from "@/lib/utils";

type Note = { text: string; className: string; rotate: string };

const NOTES: Note[] = [
  {
    text: "Our community, your help, their happiness.",
    className: "left-[4%] top-[24%]",
    rotate: "-rotate-6",
  },
  {
    text: "Small help. Big impact.",
    className: "right-[4%] top-[34%]",
    rotate: "rotate-6",
  },
  {
    text: "Every item finds its way home.",
    className: "left-[6%] bottom-[22%]",
    rotate: "rotate-3",
  },
];

export function PaperNotes({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-0 hidden lg:block",
        className
      )}
    >
      {NOTES.map((note, i) => (
        <div
          key={i}
          className={cn("absolute animate-float", note.className, note.rotate)}
          style={{ animationDelay: `${i * 1.2}s` }}
        >
                    <div className="relative rounded-sm bg-white px-4 py-3 shadow-[0_12px_30px_-12px_rgba(51,46,38,0.25)]">
            {/* Push pin */}
            <span className="absolute -top-1.5 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-electric-400 to-electric-600 shadow-sm" />
            <p className="max-w-[11rem] font-display text-[13px] leading-snug text-navy-800">
              {note.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
