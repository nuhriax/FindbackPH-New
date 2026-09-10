export default function DiscoverLoading() {
  return (
    <>
      {/* Search band — compact */}
      <div className="bg-white/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full max-w-xl">
              <div className="h-5 w-56 rounded-full skeleton" />
              <div className="mt-3 h-10 w-80 max-w-full rounded skeleton" />
              <div className="mt-2 h-4 w-72 max-w-full rounded skeleton" />
            </div>
            <div className="h-24 w-full max-w-2xl rounded-2xl skeleton lg:max-w-xl" />
          </div>
        </div>
      </div>

      {/* Sticky control dock */}
      <div className="px-4 pt-2 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/60 p-2.5 pl-3">
          <div className="h-9 w-full rounded-xl skeleton sm:w-64" />
          <div className="h-9 w-20 rounded-lg skeleton" />
          <div className="h-9 w-20 rounded-lg skeleton" />
          <div className="ml-auto hidden h-9 w-24 rounded-lg skeleton sm:block" />
          <div className="order-last flex w-full gap-2 overflow-hidden py-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 w-24 shrink-0 rounded-lg skeleton" />
            ))}
          </div>
        </div>
      </div>

      {/* Split workspace — feed + map rail */}
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-7">
          <div className="min-w-0 flex-1">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="h-6 w-40 rounded skeleton" />
                <div className="mt-1.5 h-3 w-24 rounded skeleton" />
              </div>
              <div className="h-10 w-28 rounded-full skeleton" />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
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

            <div className="mt-10 flex items-center justify-center gap-2">
              <div className="h-10 w-10 rounded-lg skeleton" />
              <div className="h-10 w-10 rounded-lg skeleton" />
              <div className="h-10 w-10 rounded-lg skeleton" />
              <div className="h-10 w-10 rounded-lg skeleton" />
            </div>
          </div>

          <div className="hidden h-[560px] w-[360px] shrink-0 rounded-2xl skeleton xl:block" />
        </div>
      </div>
    </>
  );
}
