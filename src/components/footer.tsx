import Link from "next/link";
import { HeartHandshake, MapPin, ShieldCheck, Sparkles } from "lucide-react";
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

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-ice-200/80 bg-white/70 text-navy-900 backdrop-blur-xl">
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

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Logo variant="dark" />

            {/* Community “path home” motif */}
            <div aria-hidden="true" className="mt-8 h-12 w-36">
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
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500">
              Helping Philippine communities reconnect people with the things
              they&apos;ve lost — safely, quickly, and locally.
            </p>

            {/* Trust / security */}
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { icon: ShieldCheck, label: "Verified Reports" },
                { icon: HeartHandshake, label: "Community Driven" },
                { icon: Sparkles, label: "Privacy Protected" },
              ].map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-electric-100 bg-electric-50/70 px-2.5 py-1 text-[11px] font-medium text-electric-700"
                >
                  <b.icon size={12} /> {b.label}
                </span>
              ))}
            </div>
          </div>

          {/* Explore */}
          <FooterColumn title="Explore" links={EXPLORE} />
          {/* Information */}
          <FooterColumn title="Information" links={INFORMATION} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-ice-200/80 pt-6 sm:flex-row">
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin size={12} className="text-electric-500" />
            © {new Date().getFullYear()} FindBack PH
          </p>
          <p className="text-xs text-slate-400">
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
      <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-slate-500 transition-colors hover:text-electric-600"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

