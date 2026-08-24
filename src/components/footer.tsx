import Link from "next/link";
import { Facebook, HeartHandshake, Instagram, Mail, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";

const EXPLORE = [
  { label: "Search", href: "/search" },
  { label: "Lost Items", href: "/lost" },
  { label: "Found Items", href: "/found" },
  { label: "Report Lost", href: "/report/lost" },
  { label: "Report Found", href: "/report/found" },
  { label: "How It Works", href: "/how-it-works" },
];

const INFORMATION = [
  { label: "About", href: "/about" },
  { label: "Safety", href: "/safety" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

const SOCIALS = [
  { icon: Facebook, label: "Facebook", href: "#" },
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Mail, label: "Email", href: "mailto:findback.support@gmail.com" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-ice-200/80 bg-gradient-to-b from-white via-white/80 to-ice-50/50 text-navy-900 backdrop-blur-xl">
      {/* Soft top accent line */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric-300/60 to-transparent"
      />
      {/* Faint illustrated map pattern behind the footer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(15,123,122,0.55) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse 80% 100% at 50% 0%, black, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 100% at 50% 0%, black, transparent 80%)",
        }}
      />

      {/* Ambient blue glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/4 h-64 w-[34rem] -translate-x-1/2 rounded-full bg-electric-100/60 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-20 h-64 w-80 rounded-full bg-sky-100/60 blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-1/3 h-56 w-56 rounded-full bg-emerald-50/60 blur-[100px]"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1.3fr] md:items-start lg:gap-12">
          {/* Brand */}
          <div>
            <Logo variant="dark" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              Lost today. Found tomorrow. Helping Philippine communities
              reconnect people with the things they&apos;ve lost — safely,
              quickly, and locally.
            </p>
          </div>

          {/* Explore */}
          <FooterColumn title="Explore" links={EXPLORE} />

          {/* Information */}
          <FooterColumn title="Information" links={INFORMATION} />

          {/* Community / trust rail */}
          <div className="flex flex-col items-start">
            {/* Community “path home” motif */}
            <div aria-hidden="true" className="h-9 w-32">
              <svg viewBox="0 0 160 48" fill="none" className="h-full w-full">
                <circle cx="126" cy="13" r="6" fill="#F6E7BF" opacity="0.8" />
                <path d="M0 40 C24 34 40 36 60 31 C84 27 100 34 118 30 C132 28 146 30 160 28 V48 H0 Z" fill="#BBE0C0" opacity="0.5" />
                <path d="M0 45 C34 41 60 44 92 41 C118 39 138 41 160 39 V48 H0 Z" fill="#D7EEDB" opacity="0.55" />
                <path d="M66 40 l9 -8 9 8 Z" fill="#E4C08C" />
                <rect x="69" y="32" width="12" height="11" rx="1" fill="#F7EFDF" />
                <rect x="71" y="34" width="4" height="4" fill="#B8DDF0" />
                <path d="M97 43 C95 40 99 35 108 34" stroke="#E8B06A" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 3" opacity="0.7" />
                <path d="M120 20 q3 -3 6 0 q3 -3 6 0" stroke="#9FB6D8" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.75" />
                <path d="M133 25 q2 -3 5 0 q2 -3 5 0" stroke="#9FB6D8" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.7" />
              </svg>
            </div>

            {/* Trust / security */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { icon: ShieldCheck, label: "Verified Reports" },
                { icon: HeartHandshake, label: "Community Driven" },
                { icon: Sparkles, label: "Privacy Protected" },
              ].map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-electric-100/80 bg-electric-50/60 px-2.5 py-1 text-[11px] font-medium text-electric-700"
                >
                  <b.icon size={12} /> {b.label}
                </span>
              ))}
            </div>

            {/* Socials */}
            <div className="mt-4 flex items-center gap-2.5">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target={s.href.startsWith("http") ? "_blank" : undefined}
                  rel={s.href.startsWith("http") ? "noreferrer" : undefined}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ice-200/80 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-electric-300 hover:bg-electric-500 hover:text-white hover:shadow-[0_8px_20px_-8px_rgba(15,123,122,0.6)]"
                >
                  <s.icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-ice-200/70 pt-5 sm:flex-row">
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <MapPin size={13} className="text-electric-500" />
            © {new Date().getFullYear()} FindBack PH
          </p>
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <HeartHandshake size={13} className="text-electric-400" />
            A safe and trusted community. Made to help things find their way home.
          </p>
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
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {title}
        </h3>
        <span className="mt-px h-px w-6 rounded-full bg-electric-300/70" />
      </div>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="group inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-electric-600"
            >
              <span className="h-1 w-1 rounded-full bg-electric-500 opacity-0 transition-opacity group-hover:opacity-100" />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
