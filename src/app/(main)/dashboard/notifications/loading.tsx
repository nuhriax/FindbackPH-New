export default function DashboardNotificationsLoading() {
  return (
    <div>
      <div className="h-8 w-48 skeleton" />
      <div className="mt-2 h-4 w-64 skeleton" />

      <div className="mt-6 space-y-3">
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
  );
}
