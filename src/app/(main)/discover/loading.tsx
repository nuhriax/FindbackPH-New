/**
 * Discover loading skeleton — mirrors the real page layout 1:1 (header →
 * sticky dock → split feed/map workspace) so there is no layout jump when the
 * real content streams in. Column structure matches DiscoverResultsGrid's
 * `grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3` exactly.
 */
export default function DiscoverLoading() {
  return (
    <>
      {/* Masthead — same stack as DiscoverHeader (transparent, blended) */}
      <header>
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="h-7 w-52 rounded-full skeleton" />
              <div className="mt-5 h-12 w-80 max-w-full rounded skeleton sm:h-14" />
              <div className="mt-4 h-5 w-72 max-w-full rounded skeleton" />
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="h-11 w-36 rounded-lg skeleton" />
              <div className="h-11 w-36 rounded-lg skeleton" />
            </div>
          </div>

          {/* Stat chips */}
          <div className="mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-slate-200/50 bg-white/60 px-4 py-3 shadow-soft backdrop-blur-md"
              >
                <div className="size-9 shrink-0 rounded-xl skeleton" />
                <div className="min-w-0">
                  <div className="h-4 w-20 rounded skeleton" />
                  <div className="mt-1.5 h-3 w-24 rounded skeleton" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Sticky control dock */}
      <div className="px-4 pt-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-1.5 rounded-3xl border border-white/60 bg-white/75 p-1.5 shadow-card ring-1 ring-inset ring-slate-900/[0.03] backdrop-blur-2xl sm:flex-row sm:items-center">
            <div className="h-11 min-w-0 flex-1 rounded-xl skeleton" />
            <div className="flex items-center gap-2">
              <div className="h-10 w-24 rounded-lg skeleton" />
              <div className="h-10 w-24 rounded-lg skeleton" />
            </div>
          </div>

          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex min-w-0 flex-1 gap-2 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 w-24 shrink-0 rounded-lg skeleton" />
              ))}
            </div>
            <div className="h-9 w-28 shrink-0 rounded-lg skeleton" />
          </div>
        </div>
      </div>

      {/* Split workspace — feed + map rail, matching DiscoverResultsView */}
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-7">
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <div className="h-3 w-28 rounded skeleton" />
                <div className="mt-2 h-8 w-44 rounded skeleton" />
                <div className="mt-1.5 h-4 w-52 rounded skeleton" />
              </div>

              <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 xl:hidden">
                <div className="h-7 w-16 rounded-lg skeleton" />
                <div className="h-7 w-16 rounded-lg skeleton" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 2xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70"
                >
                  <div className="aspect-[4/3] w-full skeleton" />
                  <div className="p-4">
                    <div className="h-5 w-3/4 rounded skeleton" />
                    <div className="mt-2 h-4 w-1/2 rounded skeleton" />
                    <div className="mt-3 flex items-center justify-between">
                      <div className="h-4 w-20 rounded skeleton" />
                      <div className="h-6 w-16 rounded-full skeleton" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex items-center justify-center gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="size-9 rounded-lg skeleton" />
              ))}
            </div>
          </div>

          <div className="relative hidden h-[560px] w-[360px] shrink-0 flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-card ring-1 ring-inset ring-slate-900/[0.03] 2xl:w-[400px] xl:flex">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-teal-600 via-sulo-400 to-sulo-500"
            />
            <div className="flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-3">
              <div className="h-4 w-28 rounded skeleton" />
              <div className="h-5 w-20 rounded-full skeleton" />
            </div>
            <div className="min-h-0 flex-1 skeleton" />
            <div className="h-10 border-t border-slate-100 skeleton" />
          </div>
        </div>
      </div>

      <span className="sr-only">Loading community reports…</span>
    </>
  );
}
