export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      {/* Welcome heading skeleton */}
      <div className="h-10 w-64 max-w-full skeleton" />
      <div className="mt-2 h-5 w-80 max-w-full skeleton" />

      {/* Stat cards row */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 skeleton" />
              <div className="h-8 w-8 rounded-xl skeleton" />
            </div>
            <div className="mt-3 h-8 w-16 skeleton" />
          </div>
        ))}
      </div>

      {/* Main grid — matches the dashboard layout */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Matches section */}
          <div className="card p-5">
            <div className="h-6 w-40 skeleton" />
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200/70 p-4">
                  <div className="h-12 w-12 shrink-0 rounded-xl skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 skeleton" />
                    <div className="h-3 w-1/2 skeleton" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Reports section */}
          <div className="card p-5">
            <div className="h-6 w-32 skeleton" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-slate-200/70 p-4">
                  <div className="h-4 w-3/4 skeleton" />
                  <div className="mt-2 h-3 w-1/2 skeleton" />
                  <div className="mt-3 h-6 w-16 rounded-full skeleton" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <div className="card p-5">
            <div className="h-5 w-28 skeleton" />
            <div className="mt-3 space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-4 w-full skeleton" />
              ))}
            </div>
          </div>
          <div className="card p-5">
            <div className="h-5 w-24 skeleton" />
            <div className="mt-3 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-full skeleton" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 skeleton" />
                    <div className="h-3 w-1/3 skeleton" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
