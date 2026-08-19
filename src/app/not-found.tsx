import Link from "next/link";
import { Search } from "lucide-react";
import { CommunityMotif } from "@/components/ui/community-motif";

export default function NotFound() {
  return (
    <main className="flex min-h-[72vh] flex-col items-center justify-center px-4 py-20 text-center">
      <CommunityMotif className="h-16 w-48 opacity-90" />

      <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-electric-200 bg-electric-50 px-3 py-1.5 text-xs font-semibold text-electric-700">
        <Search size={13} />
        404 · Path not found
      </span>

      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
        This path leads nowhere yet
      </h1>

      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
        The page you&apos;re looking for isn&apos;t here. But your item might
        still be out there — search the community or head back home.
      </p>

      <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
        <Link href="/" className="btn-primary">
          Back home
        </Link>
        <Link href="/search" className="btn-secondary">
          Search reports
        </Link>
      </div>
    </main>
  );
}