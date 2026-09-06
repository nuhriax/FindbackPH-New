export default function DiscoverLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
      {/* Hero heading */}
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto h-10 w-72 max-w-full skeleton" />
        <div className="mx-auto mt-4 h-5 w-96 max-w-full skeleton" />
        <div className="mx-auto mt-2 h-5 w-64 max-w-full skeleton" />
      </div>

      {/* Search bar */}
      <div className="mx-auto mt-8 max-w-2xl">
        <div className="h-14 w-full rounded-2xl skeleton" />
      </div>

      {/* Filter chips */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-20 rounded-full skeleton" />
        ))}
      </div>

      {/* Results header */}
      <div className="mt-8 flex items-center justify-between">
        <div className="h-5 w-32 skeleton" />
        <div className="h-9 w-28 rounded-lg skeleton" />
      </div>

      {/* Item grid — matches the discover layout */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70">
            {/* Image placeholder */}
            <div className="aspect-[4/3] w-full skeleton" />
            <div className="p-4">
              <div className="h-5 w-3/4 skeleton" />
              <div className="mt-2 h-4 w-1/2 skeleton" />
              <div className="mt-3 flex items-center justify-between">
                <div className="h-4 w-20 skeleton" />
                <div className="h-6 w-16 rounded-full skeleton" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-10 flex items-center justify-center gap-2">
        <div className="h-10 w-10 rounded-lg skeleton" />
        <div className="h-10 w-10 rounded-lg skeleton" />
        <div className="h-10 w-10 rounded-lg skeleton" />
        <div className="h-10 w-10 rounded-lg skeleton" />
      </div>
    </main>
  );
}
