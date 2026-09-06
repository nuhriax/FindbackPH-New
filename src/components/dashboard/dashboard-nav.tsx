"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  ArrowLeft,
  Bell,
  Bookmark,
  HeartHandshake,
  LayoutDashboard,
  ListChecks,
  MessageCircle,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

const LINK_GROUPS: {
  heading: string;
  links: { label: string; href: string; icon: typeof LayoutDashboard; hint?: string }[];
}[] = [
  {
    heading: "Main",
    links: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, hint: "Activity at a glance" },
      { label: "My Reports", href: "/dashboard/reports", icon: ListChecks, hint: "Everything you posted" },
      { label: "Messages", href: "/messages", icon: MessageCircle, hint: "Your conversations" },
      { label: "Notifications", href: "/notifications", icon: Bell, hint: "Matches and updates" },
    ],
  },
  {
    heading: "Discover",
    links: [
      { label: "Browse Reports", href: "/discover", icon: Search, hint: "Search lost & found" },
      { label: "Possible Matches", href: "/dashboard", icon: Sparkles, hint: "View your matches" },
      { label: "Saved", href: "/dashboard/saved", icon: Bookmark, hint: "Bookmarked reports" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Profile", href: "/dashboard/profile", icon: User, hint: "Your public profile" },
      { label: "Settings", href: "/dashboard/settings", icon: Settings, hint: "Account settings" },
    ],
  },
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
    ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Member"
    : "Member";
  const initial = (profile?.first_name || "U").charAt(0).toUpperCase();

  const isMember = !isAdmin;

  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-1">
      {/* User card */}
      <Link
        href="/dashboard/profile"
        className="group mb-1 flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-3 transition-colors hover:border-electric-200 hover:bg-white"
      >
        <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-electric-200 bg-electric-50 font-semibold text-electric-700">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-navy-900 group-hover:text-electric-700">{name}</p>
          <span
            className={clsx(
              "mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              isAdmin ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
            )}
          >
            {isMember ? <HeartHandshake size={10} aria-hidden="true" /> : <ShieldCheck size={10} aria-hidden="true" />}
            {isAdmin ? (profile?.role === "admin" ? "Admin" : "Moderator") : "Member"}
          </span>
        </div>
      </Link>

      {/* Grouped links */}
      {LINK_GROUPS.map((group) => (
        <div key={group.heading} className="mt-1.5">
          <p className="hidden px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 lg:block">
            {group.heading}
          </p>
          <div className="flex flex-row gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {group.links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  title={link.hint}
                  className={clsx(
                    "relative inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors lg:w-full",
                    active
                      ? "bg-electric-50 font-semibold text-electric-700"
                      : "text-slate-600 hover:bg-white/70 hover:text-electric-700"
                  )}
                >
                  {active && (
                    <span aria-hidden className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-electric-500" />
                  )}
                  <Icon size={16} className={active ? "text-electric-600" : "text-slate-400"} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mt-3 border-t border-slate-200/60 pt-3">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white/70 hover:text-navy-900"
        >
          <ArrowLeft size={16} />
          Back to FindBackPH
        </Link>
      </div>
    </nav>
  );
}