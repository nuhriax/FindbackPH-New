"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Minimal, dependency-free Sheet (side drawer) primitive.
 *
 * Supports the small API surface the Discover page needs:
 *   <Sheet>
 *     <SheetTrigger asChild><Button …/></SheetTrigger>
 *     <SheetContent className=…>…</SheetContent>
 *     <SheetHeader><SheetTitle>…</SheetTitle></SheetHeader>
 *   </Sheet>
 *
 * State lives in the nearest <Sheet> context; the trigger toggles it and the
 * content is only rendered while open (with Escape-to-close support).
 */

const SheetContext = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
}>({ open: false, setOpen: () => {} });

export function Sheet({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetTrigger({
  children,
  asChild,
  className,
}: {
  children: ReactNode;
  asChild?: boolean;
  className?: string;
}) {
  const { open, setOpen } = useContext(SheetContext);

  if (asChild && children && typeof children === "object" && "props" in children) {
    const child = children as React.ReactElement<{
      onClick?: () => void;
      className?: string;
      "aria-expanded"?: boolean;
    }>;
    return cloneTrigger(child, { onClick: () => setOpen(!open), "aria-expanded": open });
  }

  return (
    <button type="button" className={className} onClick={() => setOpen(!open)}>
      {children}
    </button>
  );
}

/** Clones the child, merging our handlers with its existing onClick. */
function cloneTrigger(
  child: React.ReactElement<{ onClick?: () => void }>,
  extra: Record<string, unknown>
) {
  const original = child.props.onClick;
  return (
    <child.type
      {...child.props}
      {...extra}
      onClick={() => {
        original?.();
        (extra.onClick as () => void)();
      }}
    />
  );
}

export function SheetContent({
  children,
  className,
  side = "right",
}: {
  children: ReactNode;
  className?: string;
  side?: "right" | "left";
}) {
  const { open, setOpen } = useContext(SheetContext);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close sheet"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "absolute inset-y-0 flex w-80 max-w-[85vw] flex-col overflow-y-auto bg-white p-6 shadow-2xl",
          side === "right" ? "right-0" : "left-0",
          className
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-navy-900"
        >
          <X className="size-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ children }: { children: ReactNode }) {
  return <div className="mb-2 pr-8">{children}</div>;
}

export function SheetTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-semibold text-navy-900">{children}</h2>;
}
