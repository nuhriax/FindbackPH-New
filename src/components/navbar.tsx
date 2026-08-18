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
  { label: "Search", href: "/search" },
  { label: "Report Lost", href: "/report/lost" },
  { label: "Report Found", href: "/report/found" },
  { label: "How It Works", href: "/how-it-works" },
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
        scrolled ? "pt-2" : "pt-3 sm:pt-4"
      )}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        {/* Floating pill shell */}
        <div
          className={clsx(
            "mx-auto flex h-14 items-center justify-between gap-3 rounded-full border px-3 transition-all duration-300 sm:px-4",
            scrolled
              ? "border-white/70 bg-white/80 shadow-[0_16px_46px_-22px_rgba(20,34,79,0.45)] backdrop-blur-2xl"
              : "border-white/60 bg-white/60 shadow-[0_10px_36px_-24px_rgba(20,34,79,0.35)] backdrop-blur-xl"
          )}
        >
          <Logo />

          <nav className="hidden items-center gap-0.5 lg:flex">
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
                    "relative rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200",
                    active ? "text-blue-700" : "text-slate-600 hover:bg-white/70 hover:text-blue-700"
                  )}
                >
                  {link.label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className={clsx(
                        "absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gradient-to-r",
                        isLost
                          ? "from-indigo-400 to-indigo-300"
                          : isFound
                            ? "from-emerald-400 to-emerald-300"
                            : "from-blue-500 to-cyan-400"
                      )}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-0.5 lg:flex">
            <Link
              href="/search"
              aria-label="Search"
              className="rounded-full p-2.5 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
            >
              <Search size={18} />
            </Link>

            {user ? (
              <>
                <Link
                  href="/notifications"
                  aria-label="Notifications"
                  className="relative rounded-full p-2.5 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
                >
                  <Bell size={18} />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500" />
                </Link>
                <Link
                  href="/messages"
                  aria-label="Messages"
                  className="rounded-full p-2.5 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
                >
                  <MessageCircle size={18} />
                </Link>
                <Link
                  href="/saved"
                  aria-label="Saved items"
                  className="rounded-full p-2.5 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
                >
                  <Bookmark size={18} />
                </Link>
                <Link
                  href="/dashboard"
                  className="group ml-1 flex items-center gap-2.5 rounded-full border border-white/80 bg-white/80 py-1 pl-1 pr-3 shadow-sm transition-colors hover:border-blue-200"
                  title={firstName}
                >
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-semibold text-white">
                      {getInitials(profile)}
                    </span>
                  )}
                  <span className="hidden max-w-[8rem] truncate text-sm font-medium text-navy-900 xl:block">
                    {profile?.username ?? user.email}
                  </span>
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    aria-label="Log out"
                    className="ml-0.5 rounded-full p-2.5 text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
                  >
                    <LogOut size={18} />
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-blue-700"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="ml-1 inline-flex items-center rounded-full bg-gradient-to-b from-blue-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-[0_8px_24px_-10px_rgba(37,99,235,0.65)] transition-all duration-200 hover:-translate-y-px hover:from-blue-400 hover:to-blue-500"
                >
                  Create account
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="flex items-center gap-1 lg:hidden">
            {user ? (
              <Link
                href="/dashboard"
                aria-label="Dashboard"
                className="rounded-full p-2 text-slate-600 hover:text-blue-700"
              >
                <LayoutDashboard size={20} />
              </Link>
            ) : null}
            <button
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="rounded-full p-2 text-slate-700 transition-colors hover:bg-white/80"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu — floating panel below the pill */}
        <div
          className={clsx(
            "mt-2 overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-[0_24px_60px_-28px_rgba(20,34,79,0.5)] backdrop-blur-2xl transition-[max-height,opacity] duration-300 lg:hidden",
            open ? "max-h-[42rem] opacity-100" : "max-h-0 border-transparent opacity-0"
          )}
        >
          <nav className="flex flex-col gap-1 px-3 py-4">
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
                    "rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? isLost
                        ? "bg-indigo-50 text-indigo-700"
                        : isFound
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
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
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-semibold text-white">
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
    </header>
  );
}