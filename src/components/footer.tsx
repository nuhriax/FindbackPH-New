import Link from "next/link";
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
    <footer className="relative border-t border-slate-200/70 bg-white/55 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              Helping communities reconnect people with the things they&apos;ve lost.
            </p>
          </div>

          {/* Explore */}
          <FooterColumn title="Explore" links={EXPLORE} />
          {/* Information */}
          <FooterColumn title="Information" links={INFORMATION} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200/80 pt-6 sm:flex-row">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} FindBack PH
          </p>
          <p className="text-xs text-slate-400">
            Made to help things find their way home.
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
              className="text-sm text-slate-500 transition-colors hover:text-blue-700"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
