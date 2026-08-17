import Link from "next/link";
import { MapPin, HeartHandshake, Twitter, Facebook, Instagram } from "lucide-react";
import { Logo } from "@/components/logo";

const EXPLORE = [
  { label: "Lost Items", href: "/lost" },
  { label: "Found Items", href: "/found" },
  { label: "Search Reports", href: "/search" },
  { label: "Report a Lost Item", href: "/report/lost" },
  { label: "Report a Found Item", href: "/report/found" },
];

const LEARN = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Safety", href: "/#safety" },
  { label: "About", href: "/#impact" },
  { label: "Community", href: "/#impact" },
];

const ACCOUNT = [
  { label: "Log in", href: "/login" },
  { label: "Create account", href: "/register" },
  { label: "Dashboard", href: "/dashboard" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#070b17]/70">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-electric-500/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              A community-powered lost &amp; found platform for the Philippines. People lose things.
              People find things. FindBack PH brings them back together — safely.
            </p>
            <p className="mt-5 flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin size={14} className="text-electric-400" /> For every province in the Philippines
            </p>
          </div>

          <FooterColumn title="Explore" links={EXPLORE} />
          <FooterColumn title="Learn" links={LEARN} />
          <FooterColumn title="Account" links={ACCOUNT} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} FindBack PH. Built for the Filipino community.
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <HeartHandshake size={14} /> Community powered
            </span>
          </div>
          <div className="flex items-center gap-2">
            {[Twitter, Facebook, Instagram].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social link"
                className="rounded-lg border border-white/10 p-2 text-slate-400 transition-colors hover:border-electric-500/40 hover:text-white"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-sm text-slate-400 transition-colors hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
