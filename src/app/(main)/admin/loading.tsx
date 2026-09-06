export default function AdminLoading() {
  return (
    <div>
      {/* Page heading */}
      <div className="h-8 w-48 skeleton" />
      <div className="mt-2 h-4 w-72 skeleton" />

      {/* Stat cards grid — matches admin layout */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card relative overflow-hidden p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-20 skeleton" />
                <div className="h-7 w-12 skeleton" />
              </div>
              <div className="h-9 w-9 rounded-xl skeleton" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent flags + recent reports */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Pending flags */}
        <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5">
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 skeleton" />
            <div className="h-4 w-16 skeleton" />
          </div>
          <div className="mt-3 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-3/4 skeleton" />
                  <div className="h-3 w-1/2 skeleton" />
                </div>
                <div className="h-8 w-16 rounded-lg skeleton" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent reports */}
        <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5">
          <div className="flex items-center justify-between">
            <div className="h-5 w-28 skeleton" />
            <div className="h-4 w-16 skeleton" />
          </div>
          <div className="mt-3 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-3/4 skeleton" />
                  <div className="h-3 w-1/3 skeleton" />
                </div>
                <div className="h-6 w-16 rounded-full skeleton" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
