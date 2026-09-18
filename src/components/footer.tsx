import Link from "next/link";
import { HeartHandshake, Lock, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { RouteRule } from "@/components/ui/journey-band";

const EXPLORE = [
  { label: "Lost Items", href: "/lost" },
  { label: "Found Items", href: "/found" },
  { label: "How It Works", href: "/how-it-works" },
];

const INFORMATION = [
  { label: "About", href: "/about" },
  { label: "Safety", href: "/safety" },
  { label: "FAQ", href: "/faq" },
];

const LEGAL = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Contact", href: "/contact" },
];

const TRUST_STATS = [
  {
    icon: HeartHandshake,
    label: "Community-driven",
    detail: "Real reports from real people",
  },
  {
    icon: Lock,
    label: "Privacy-first",
    detail: "Contacts stay hidden by default",
  },
  {
    icon: Sparkles,
    label: "Free forever",
    detail: "No fees, no middlemen",
  },
];

export function Footer() {
  return (
    <footer className="footer-ink relative overflow-hidden">
      {/* Faint dotted map pattern behind the footer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse 80% 100% at 50% 0%, black, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 100% at 50% 0%, black, transparent 80%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-12">
          {/* Brand */}
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed">
              Every lost thing has a way home. The Philippines&apos; free
              community lost-and-found platform — private by design, safe by
              design, built for every island and barangay.
            </p>
            <RouteRule className="mt-6 max-w-[220px]" />
          </div>

          {/* Explore */}
          <FooterColumn title="Explore" links={EXPLORE} />

          {/* Information */}
          <FooterColumn title="Information" links={INFORMATION} />

          {/* Trust stats */}
          <ul className="flex flex-col gap-4 sm:flex-col sm:gap-3">
            {TRUST_STATS.map((item) => (
              <li key={item.label} className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="footer-chip flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                >
                  <item.icon size={14} />
                </span>
                <span className="text-xs font-medium leading-tight">
                  {item.label}
                  <span
                    className="block text-[10px] font-normal"
                    style={{ color: "var(--footer-faint)" }}
                  >
                    {item.detail}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom bar — copyright · legal (centered) · tagline */}
        <div
          className="mt-12 grid items-center gap-3 border-t pt-6 md:grid-cols-3"
          style={{ borderColor: "var(--footer-line)" }}
        >
          <p className="text-xs font-medium md:justify-start">
            © {new Date().getFullYear()} FindBack PH
          </p>

          <nav
            aria-label="Legal"
            className="flex items-center justify-center gap-2 text-xs"
          >
            {LEGAL.map((item, i) => (
              <span key={item.label} className="flex items-center gap-2">
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="h-1 w-1 rounded-full"
                    style={{ background: "var(--footer-faint)" }}
                  />
                )}
                <Link href={item.href} className="footer-link">
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>

          <p
            className="flex items-center justify-center gap-1.5 text-xs md:justify-end"
            style={{ color: "var(--footer-faint)" }}
          >
            <HeartHandshake size={13} style={{ color: "var(--footer-accent)" }} aria-hidden="true" />
            Every lost thing has a way home.
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
    <nav aria-label={title}>
      <h3 className="footer-title text-xs font-semibold uppercase tracking-[0.16em]">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="footer-link-group footer-link inline-flex items-center gap-1.5 text-sm"
            >
              <span aria-hidden="true" className="footer-dot h-1 w-1 rounded-full" />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}