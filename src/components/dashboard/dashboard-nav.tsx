"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  ArrowLeft,
  Bell,
  Bookmark,
  LayoutDashboard,
  ListChecks,
  MessageCircle,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";

const LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Reports", href: "/dashboard/reports", icon: ListChecks },
  { label: "Messages", href: "/messages", icon: MessageCircle },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Saved", href: "/saved", icon: Bookmark },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

type ProfileShape = {
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  role?: string | null;
};

export function DashboardNav({ isAdmin, profile }: { isAdmin: boolean; profile: ProfileShape | null }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname === href || pathname.startsWith(`${href}/`);

  const name = profile
    ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || profile.username || "Member"
    : "Member";
  const initial = (profile?.first_name || profile?.username || "U").charAt(0).toUpperCase();

  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-1">
      {/* User card */}
      <div className="mb-2 flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-3">
        <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-blue-200 bg-blue-50 font-semibold text-blue-700">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-navy-900">{name}</p>
          <p className="truncate text-xs text-slate-500">@{profile?.username ?? "member"}</p>
        </div>
      </div>

      {/* Links */}
      <div className="flex flex-row gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {LINKS.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "inline-flex shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors lg:w-full",
                active
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-transparent text-slate-600 hover:bg-white/70 hover:text-blue-700"
              )}
            >
              <Icon size={16} />
              {link.label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/admin"
            aria-current={isActive("/admin") ? "page" : undefined}
            className={clsx(
              "inline-flex shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors lg:w-full",
              isActive("/admin")
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                : "border-transparent text-slate-600 hover:bg-white/70 hover:text-indigo-700"
            )}
          >
            <ShieldCheck size={16} />
            Admin
          </Link>
        )}
      </div>

      <div className="mt-3 border-t border-slate-200/60 pt-3">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white/70 hover:text-navy-900"
        >
          <ArrowLeft size={16} />
          Back to site
        </Link>
      </div>
    </nav>
  );
}