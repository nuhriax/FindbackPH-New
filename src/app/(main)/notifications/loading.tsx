export default function NotificationsLoading() {
  return (
    <div className="py-16 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="h-4 w-32 skeleton" />
        <div className="mt-3 h-8 w-48 skeleton" />
        <div className="mt-2 h-4 w-64 skeleton" />

        <div className="mt-8 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-4">
              <div className="h-10 w-10 shrink-0 rounded-full skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 skeleton" />
                <div className="h-3 w-1/2 skeleton" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
