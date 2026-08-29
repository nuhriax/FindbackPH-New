"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Search, Menu, X, LogOut, LayoutDashboard, MessageCircle, Bookmark, ChevronDown } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import { logoutAction } from "@/lib/actions/auth";
import { Logo } from "@/components/logo";
import { NotificationDropdown, MessagesDropdown, SavedDropdown } from "@/components/navbar/nav-dropdowns";

// Primary actions stay in the top bar; secondary info pages live under "More"
// so the navbar doesn't overflow or bury the main CTAs.
const PRIMARY_LINKS = [
  { label: "Home", href: "/" },
  { label: "Finds", href: "/finds" },
  { label: "Report Lost", href: "/report/lost" },
  { label: "Report Found", href: "/report/found" },
];

const MORE_LINKS = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Safety", href: "/safety" },
  { label: "About", href: "/about" },
];

function getInitials(profile: Profile | null) {
  if (!profile) return "U";
  const first = profile.first_name?.[0] ?? "";
  const last = profile.last_name?.[0] ?? "";
  return (first + last).toUpperCase() || (profile.username?.[0] ?? "U").toUpperCase();
}

export function Navbar({
  user,
  profile,
  notificationCount = 0,
  messageCount = 0,
  savedCount = 0,
}: {
  user: User | null;
  profile: Profile | null;
  /** Unread notifications excluding chat messages (shown on the bell). */
  notificationCount?: number;
  /** Unread new-message notifications (shown on the chat icon). */
  messageCount?: number;
  /** Total saved reports (shown on the bookmark icon). */
  savedCount?: number;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const moreRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the account dropdown on outside click or Escape.
  useEffect(() => {
    if (!accountOpen) return;
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);


  // Close the "More" dropdown on outside click or Escape.
  useEffect(() => {
    if (!moreOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  // Close the mobile menu on Escape or whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const firstName = profile?.first_name ?? user?.user_metadata?.full_name ?? "FindBack";

  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled ? "pt-2" : "pt-3 sm:pt-4"
      )}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        {/* Floating pill shell */}
        <div
          className={clsx(
            "mx-auto flex h-14 items-center justify-between gap-3 rounded-[20px] border px-3 transition-all duration-300 sm:px-4",
            scrolled
              ? "border-ice-200/80 bg-white/90 shadow-[0_16px_46px_-22px_rgba(15,123,122,0.35)] backdrop-blur-2xl"
              : "border-white/80 bg-white/85 shadow-[0_10px_36px_-24px_rgba(15,123,122,0.28)] backdrop-blur-xl"
          )}
        >
          <Logo />

          <nav className="hidden items-center gap-0.5 lg:flex">
            {PRIMARY_LINKS.map((link) => {
              const active = isActive(link.href);

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "relative rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200",
                    active ? "text-navy-800" : "text-slate-600 hover:bg-white/70 hover:text-navy-800"
                  )}
                >
                  {link.label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-electric-500 to-electric-400"
                    />
                  )}
                </Link>
              );
            })}

            {/* More dropdown */}
            <div ref={moreRef} className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-white/70 hover:text-navy-800"
              >
                More
                <ChevronDown
                  size={14}
                  className={clsx("transition-transform duration-200", moreOpen && "rotate-180")}
                />
              </button>

              <div
                className={clsx(
                  "absolute left-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_20px_50px_-20px_rgba(20,34,79,0.4)] backdrop-blur-2xl transition-[opacity,transform] duration-200",
                  moreOpen
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none -translate-y-1 opacity-0"
                )}
              >
                {MORE_LINKS.map((link) => {
                  const active = isActive(link.href);

                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setMoreOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={clsx(
                        "block rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-electric-50 text-electric-700"
                          : "text-slate-600 hover:bg-navy-50 hover:text-navy-800"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          <div className="hidden items-center gap-0.5 lg:flex">
            <Link
              href="/search"
              aria-label="Search"
              className="rounded-full p-2.5 text-slate-500 transition-colors hover:bg-navy-50 hover:text-navy-800"
            >
              <Search size={18} />
            </Link>

            {user ? (
              <>
                <NotificationDropdown initialCount={notificationCount} />
                <MessagesDropdown initialCount={messageCount} />
                <SavedDropdown initialCount={savedCount} />
                <div ref={accountRef} className="relative ml-1">
                  <button
                    type="button"
                    onClick={() => setAccountOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={accountOpen}
                    className="group flex items-center gap-2.5 rounded-full border border-white/80 bg-white/80 py-1 pl-1 pr-3 shadow-sm transition-colors hover:border-navy-200"
                    title={firstName}
                  >
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-electric-500 to-electric-600 text-xs font-semibold text-white">
                        {getInitials(profile)}
                      </span>
                    )}
                    <span className="hidden max-w-[8rem] truncate text-sm font-medium text-navy-900 xl:block">
                      {profile?.username ?? user.email}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-500 transition-transform ${accountOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Account dropdown — scrollable when tall */}
                  {accountOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-56 overflow-y-auto rounded-2xl border border-navy-100 bg-white p-2 shadow-xl"
                    >
                      <Link
                        href="/dashboard"
                        role="menuitem"
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-50"
                        onClick={() => setAccountOpen(false)}
                      >
                        <LayoutDashboard size={17} className="text-slate-500" />
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/profile"
                        role="menuitem"
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-50"
                        onClick={() => setAccountOpen(false)}
                      >
                        <Bookmark size={17} className="text-slate-500" />
                        Profile
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        role="menuitem"
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-50"
                        onClick={() => setAccountOpen(false)}
                      >
                        <MessageCircle size={17} className="text-slate-500" />
                        Settings
                      </Link>
                      <div className="my-1 h-px bg-navy-100" />
                      <form action={logoutAction}>
                        <button
                          type="submit"
                          role="menuitem"
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          <LogOut size={17} />
                          Sign out
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-navy-800"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="ml-1 inline-flex items-center rounded-full bg-gradient-to-b from-electric-500 to-electric-600 px-4 py-2 text-sm font-medium text-white shadow-[0_8px_24px_-10px_rgba(15,123,122,0.65)] transition-all duration-200 hover:-translate-y-px hover:from-electric-400 hover:to-electric-500"
                >
                  Create account
                </Link>
              </>
            )}
          </div>

          {/* Mobile actions — search stays one tap away */}
          <div className="flex items-center gap-0.5 lg:hidden">
            <Link
              href="/search"
              aria-label="Search"
              className="rounded-full p-2.5 text-slate-600 transition-colors hover:bg-white/80 hover:text-navy-800"
            >
              <Search size={20} />
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                aria-label="Dashboard"
                className="rounded-full p-2.5 text-slate-600 transition-colors hover:bg-white/80 hover:text-navy-800"
              >
                <LayoutDashboard size={20} />
              </Link>
            ) : null}
            <button
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-white/80"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu — floating panel below the pill. Height tracks the
            viewport so long signed-in menus always fit and can scroll. */}
        <div
          className={clsx(
            "mt-2 overflow-y-auto overscroll-contain rounded-3xl border border-white/70 bg-white/90 shadow-[0_24px_60px_-28px_rgba(20,34,79,0.5)] backdrop-blur-2xl transition-[max-height,opacity] duration-300 lg:hidden",
            open ? "max-h-[calc(100dvh-6rem)] opacity-100" : "max-h-0 border-transparent opacity-0"
          )}
        >
          <nav className="flex flex-col gap-1 px-3 py-4">
            {PRIMARY_LINKS.map((link) => {
              const active = isActive(link.href);
              const isLost = link.href === "/lost";
              const isFound = link.href === "/found";

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? isLost
                        ? "bg-sunrise-50 text-sunrise-700"
                        : isFound
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-electric-50 text-electric-700"
                      : "text-slate-700 hover:bg-navy-50 hover:text-navy-800"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="px-4 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Learn more
            </div>
            {MORE_LINKS.map((link) => {
              const active = isActive(link.href);

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-electric-50 text-electric-700"
                      : "text-slate-700 hover:bg-navy-50 hover:text-navy-800"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-200/80 pt-4">
              {user ? (
                <>
                  <div className="flex items-center gap-2.5 px-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-electric-500 to-electric-600 text-xs font-semibold text-white">
                      {getInitials(profile)}
                    </span>
                    <span className="text-sm text-navy-900">{firstName}</span>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-navy-700">Signed in</span>
                  </div>
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="btn-ghost justify-start">
                    Dashboard
                  </Link>
                  <Link href="/messages" onClick={() => setOpen(false)} className="btn-ghost justify-start">
                    Messages
                  </Link>
                  <Link href="/notifications" onClick={() => setOpen(false)} className="btn-ghost justify-start">
                    Notifications
                  </Link>
                  <Link href="/saved" onClick={() => setOpen(false)} className="btn-ghost justify-start">
                    Saved Items
                  </Link>
                  <Link href="/dashboard/profile" onClick={() => setOpen(false)} className="btn-ghost justify-start">
                    Profile
                  </Link>
                  <Link href="/dashboard/settings" onClick={() => setOpen(false)} className="btn-ghost justify-start">
                    Settings
                  </Link>
                  <form action={logoutAction}>
                    <button type="submit" className="btn-ghost w-full justify-start text-slate-500">
                      <LogOut size={16} /> Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="btn-secondary">
                    Log in
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="btn-primary">
                    Create account
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </motion.header>
  );
}