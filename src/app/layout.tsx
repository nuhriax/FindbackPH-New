import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { BackgroundEffects } from "@/components/ui/background-effects";
import { ToastProvider } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/server";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://findback.ph"),
  title: "FindBack PH — Lost & Found Philippines",
  description:
    "FindBack PH connects people who lost something with people who found it — safely, quickly, and locally.",
  applicationName: "FindBack PH",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "FindBack PH — Lost & Found Philippines",
    description: "Lost something? Let's bring it back.",
    url: "/",
    siteName: "FindBack PH",
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "FindBack PH — Lost & Found Philippines",
    description: "Lost something? Let's bring it back.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body className="flex min-h-screen flex-col font-sans text-navy-900 antialiased">
        <BackgroundEffects />
        <ToastProvider>
          <Navbar user={user} profile={profile} />
          <main className="flex-1">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
