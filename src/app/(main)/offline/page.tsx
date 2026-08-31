/**
 * Offline fallback served by the service worker when a navigation fails and
 * nothing cached matches. Static on purpose — no data fetching, so it always
 * renders even with zero connectivity.
 */
export const metadata = {
  title: "You're offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M12.5 18.5 8 22l4.5-3.5Z" fill="currentColor" stroke="none" />
        </svg>
      </div>

      <h1 className="mt-5 font-display text-2xl font-semibold text-navy-900">
        You&apos;re offline
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
        FindBack PH needs a connection to show live reports and matches.
        Check your internet connection and try again — your in-progress reports
        are safe in this tab.
      </p>
    </main>
  );
}
