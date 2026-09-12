"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal, dependency-free dropdown menu primitive.
 *
 * Supports the API surface the Discover page needs:
 *   <DropdownMenu>
 *     <DropdownMenuTrigger asChild><Button …/></DropdownMenuTrigger>
 *     <DropdownMenuContent className=…>…</DropdownMenuContent>
 *     <DropdownMenuItem asChild><Link …/></DropdownMenuItem>
 *   </DropdownMenu>
 *
 * The menu closes on outside click, Escape, or item selection.
 */

const MenuContext = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
  itemRefs: React.MutableRefObject<Set<() => void>>;
}>({
  open: false,
  setOpen: () => {},
  itemRefs: { current: new Set() },
});

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Set<() => void>());

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <MenuContext.Provider value={{ open, setOpen, itemRefs }}>
      <div ref={rootRef} className="relative inline-block">
        {children}
      </div>
    </MenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  asChild,
  className,
}: {
  children: ReactNode;
  asChild?: boolean;
  className?: string;
}) {
  const { open, setOpen } = useContext(MenuContext);

  if (asChild && children && typeof children === "object" && "props" in children) {
    const child = children as React.ReactElement<{ onClick?: () => void }>;
    const original = child.props.onClick;
    const Comp = child.type as React.ElementType;
    return (
      <Comp
        {...child.props}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          original?.();
          setOpen(!open);
        }}
      />
    );
  }

  return (
    <button
      type="button"
      className={className}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { open } = useContext(MenuContext);
  if (!open) return null;

  return (
      <div
        role="menu"
        className={cn(
          "absolute right-0 z-50 mt-2 min-w-[10rem] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-navy-900 shadow-xl [&_a]:block [&_a]:cursor-pointer [&_a]:rounded-lg [&_a]:px-3 [&_a]:py-2 [&_a]:text-sm [&_a]:font-medium [&_a]:text-slate-700 [&_a:hover]:bg-slate-100 [&_a:hover]:text-teal-700",
          className
        )}
      >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  asChild,
  className,
}: {
  children: ReactNode;
  asChild?: boolean;
  className?: string;
}) {
  const { setOpen } = useContext(MenuContext);

  if (asChild && children && typeof children === "object" && "props" in children) {
    const child = children as React.ReactElement<{ onClick?: () => void }>;
    const original = child.props.onClick;
    const Comp = child.type as React.ElementType;
    return (
      <Comp
        {...child.props}
        role="menuitem"
        onClick={() => {
          original?.();
          setOpen(false);
        }}
      />
    );
  }

  return (
    <button
      type="button"
      role="menuitem"
      className={cn("block w-full px-3 py-2 text-left text-sm", className)}
      onClick={() => setOpen(false)}
    >
      {children}
    </button>
  );
}
