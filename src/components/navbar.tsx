"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Search, Bell, Menu, X, LogOut, LayoutDashboard, MessageCircle, Bookmark } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import { logoutAction } from "@/lib/actions/auth";
import { Logo } from "@/components/logo";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Lost Items", href: "/lost" },
  { label: "Found Items", href: "/found" },
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

export function Navbar({ user, profile }: { user: User | null; profile: Profile | null }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

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

  const firstName = profile?.first_name ?? user?.user_metadata?.full_name ?? "FindBack";

  return (
    <header
      className={clsx(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-slate-200/70 bg-white/80 shadow-[0_10px_40px_-22px_rgba(20,34,79,0.35)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            const isLost = link.href === "/lost";
            const isFound = link.href === "/found";

            return (
              <Link
                key={link.label}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? isLost
                      ? "bg-indigo-50 text-indigo-700"
                      : isFound
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
                )}
              >
                {link.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className={clsx(
                      "absolute inset-x-2 -bottom-px h-0.5 rounded-full",
                      isLost
                        ? "bg-indigo-400/70"
                        : isFound
                          ? "bg-emerald-400/70"
                          : "bg-blue-500/70"
                    )}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-1 lg:flex">
          <Link
            href="/search"
            aria-label="Search"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
          >
            <Search size={18} />
          </Link>

          {user ? (
            <>
              <Link
                href="/notifications"
                aria-label="Notifications"
                className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
              >
                <Bell size={18} />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500" />
              </Link>
              <Link
                href="/messages"
                aria-label="Messages"
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
              >
                <MessageCircle size={18} />
              </Link>
              <Link
                href="/saved"
                aria-label="Saved items"
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
              >
                <Bookmark size={18} />
              </Link>
              <Link
                href="/dashboard"
                className="group ml-1 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white/70 py-1.5 pl-1.5 pr-3 shadow-sm transition-colors hover:border-blue-200 hover:bg-white"
                title={firstName}
              >
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-semibold text-white">
                    {getInitials(profile)}
                  </span>
                )}
                <span className="hidden max-w-[9rem] truncate text-sm font-medium text-navy-900 xl:block">
                  {profile?.username ?? user.email}
                </span>
                <span className="hidden text-[10px] font-medium uppercase tracking-wide text-blue-600 xl:block">
                  Signed in
                </span>
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  aria-label="Log out"
                  className="ml-1 rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
                >
                  <LogOut size={18} />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Log in
              </Link>
              <Link href="/register" className="btn-primary !px-4 !py-2 text-sm">
                Create account
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          {user ? (
            <Link href="/dashboard" aria-label="Dashboard" className="rounded-lg p-2 text-slate-500 hover:text-blue-700">
              <LayoutDashboard size={20} />
            </Link>
          ) : null}
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-50"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={clsx(
          "overflow-hidden border-t border-slate-200/70 bg-white/95 backdrop-blur-xl transition-[max-height,opacity] duration-300 lg:hidden",
          open ? "max-h-[40rem] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
          {NAV_LINKS.map((link) => {
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
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? isLost
                      ? "bg-indigo-50 text-indigo-700"
                      : isFound
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-blue-50 text-blue-700"
                    : "text-slate-700 hover:bg-slate-50 hover:text-blue-700"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="mt-2 flex flex-col gap-2 border-t border-slate-200/80 pt-4">
            {user ? (
              <>
                <div className="flex items-center gap-2.5 px-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-semibold text-white">
                    {getInitials(profile)}
                  </span>
                  <span className="text-sm text-navy-900">{firstName}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-blue-600">Signed in</span>
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
    </header>
  );
}
