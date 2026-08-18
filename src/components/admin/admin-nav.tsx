"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { FileText, Flag, LayoutDashboard, ScrollText, Settings, Users } from "lucide-react";

const LINKS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Reports", href: "/admin/reports?type=lost_item", icon: FileText },
  { label: "Flags", href: "/admin/flags", icon: Flag },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === "/admin"
      ? pathname === href
      : href.split("?")[0] === "/admin"
        ? pathname === "/admin"
        : pathname === href.split("?")[0] || pathname.startsWith(`${href.split("?")[0]}/`);

  return (
    <nav aria-label="Admin" className="flex gap-1.5 overflow-x-auto pb-1">
      {LINKS.map((link) => {
        const Icon = link.icon;
        const active = isActive(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
              active
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                : "border-transparent text-slate-600 hover:bg-white/70 hover:text-indigo-700"
            )}
          >
            <Icon size={15} aria-hidden="true" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}