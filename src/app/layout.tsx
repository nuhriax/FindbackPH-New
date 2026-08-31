import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import "./globals.css";
import "./auth.css";
import { BackgroundEffects } from "@/components/ui/background-effects";
import { ToastProvider } from "@/components/ui/toast";
import { PwaRegister } from "@/components/pwa/pwa-register";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-pjs",
  display: "swap",
});

// Sora is the display/brand font — used only via the `font-display` Tailwind
// family (all h1–h6 and hero/stat display text). Plus Jakarta Sans remains the
// UI/body font for everything else.
const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://findbackph.me"),
  title: {
    // Pages that don't export their own title get "<title> — FindBack PH".
    default: "FindBack PH — Lost & Found Philippines",
    template: "%s | FindBack PH",
  },
  description:
    "FindBack PH — every lost thing has a way home. The Philippines' free community lost-and-found platform: report a lost or found item, search local reports, match safely, and reunite things with their owners. Private by default, free forever.",
  applicationName: "FindBack PH",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "FindBack PH — Lost & Found Philippines",
    description: "Lost something in the Philippines? FindBack PH helps you find it.",
    url: "/",
    siteName: "FindBack PH",
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "FindBack PH — Lost & Found Philippines",
    description: "Lost something in the Philippines? FindBack PH helps you find it.",
  },
  robots: {
    index: true,
    follow: true,
  },
  // PWA installability: served from /manifest.webmanifest with the service
  // worker registered by <PwaRegister /> (production only).
  manifest: "/manifest.webmanifest",
  // Search-engine site ownership. Renders verification <meta> tags only when the
  // corresponding env vars are set (the "HTML tag" method), so nothing is emitted
  // until a value is added. Adding a value requires a redeploy (a git push).
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } }
      : {}),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the inline theme script below mutates
    // <html> (data-auth-theme) before React hydrates, by design — without
    // this, React logs a hydration attribute-mismatch warning on every load.
    <html lang="en" className={`${plusJakarta.variable} ${sora.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans text-navy-900 antialiased">
        {/* Skip link for keyboard / screen-reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-navy-900 focus:shadow-xl"
        >
          Skip to main content
        </a>
        {/* Apply the saved auth theme before first paint to avoid a dark-mode flash.
            Sets an attribute on <html>; CSS + useTheme read it (no hydration clash). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('fb-auth-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-auth-theme',t||'light');}catch(e){document.documentElement.setAttribute('data-auth-theme','light');}})();`,
          }}
        />
        <BackgroundEffects />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "FindBack PH",
              url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://findbackph.me",
              description:
                "FindBack PH connects people who lost something with people who found it — safely, quickly, and locally.",
            }),
          }}
        />
        <ToastProvider>{children}</ToastProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
