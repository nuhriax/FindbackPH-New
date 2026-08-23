import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { CommunityMotif } from "@/components/ui/community-motif";

export default function NotFound() {
  return (
    <main className="relative flex min-h-[72vh] items-center justify-center overflow-hidden px-4 py-20">
      <div className="relative z-10 flex max-w-lg flex-col items-center text-center">
        <CommunityMotif
          aria-hidden="true"
          className="h-16 w-48 opacity-80"
        />

        <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-electric-200 bg-electric-50 px-3.5 py-1.5 text-xs font-semibold text-electric-700 shadow-sm">
          <Search size={13} strokeWidth={2.5} />
          <span>404 · Path not found</span>
        </div>

        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
          This path leads nowhere yet.
        </h1>

        <p className="mt-4 max-w-md text-sm leading-6 text-slate-600 sm:text-base">
          The page you&apos;re looking for doesn&apos;t exist or may have
          moved. Your item might still be out there — try searching the
          community or head back home.
        </p>

        <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/"
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft size={15} />
            Back home
          </Link>

          <Link
            href="/search"
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            <Search size={15} />
            Search reports
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Maybe what you&apos;re looking for is still waiting to be found.
        </p>
      </div>
    </main>
  );
}