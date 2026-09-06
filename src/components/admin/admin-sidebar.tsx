"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  ArrowLeft,
  BarChart3,
  FileText,
  Flag,
  History,
  Inbox,
  LayoutDashboard,
  ScrollText,
  Settings,
  Shield,
  Users,
} from "lucide-react";

const LINK_GROUPS: {
  heading: string;
  links: { label: string; href: string; icon: typeof LayoutDashboard }[];
}[] = [
  {
    heading: "Overview",
    links: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    heading: "Moderation",
    links: [
      { label: "Reports", href: "/admin/reports?type=lost_item", icon: FileText },
      { label: "Flagged Content", href: "/admin/flags", icon: Flag },
      { label: "Users", href: "/admin/users", icon: Users },
    ],
  },
  {
    heading: "Platform",
    links: [
      { label: "Contact Inbox", href: "/admin/messages", icon: Inbox },
      { label: "Items", href: "/admin/reports", icon: FileText },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "Activity Log", href: "/admin/audit-logs", icon: History },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    const basePath = href.split("?")[0];
    return pathname === basePath || pathname.startsWith(`${basePath}/`);
  };

  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      <div className="mb-3 flex items-center gap-2.5 px-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-electric-200 bg-electric-50 text-electric-600">
          <Shield size={16} />
        </span>
        <div>
          <p className="text-sm font-semibold text-navy-900">FindBackPH</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Admin</p>
        </div>
      </div>

      {LINK_GROUPS.map((group) => (
        <div key={group.heading} className="mt-2">
          <p className="hidden px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 lg:block">
            {group.heading}
          </p>
          <div className="flex flex-row gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {group.links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
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