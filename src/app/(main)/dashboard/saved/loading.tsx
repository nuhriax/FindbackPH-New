export default function SavedLoading() {
  return (
    <div>
      <div className="h-4 w-32 skeleton" />
      <div className="mt-3 h-8 w-48 skeleton" />
      <div className="mt-2 h-4 w-64 skeleton" />

      <div className="mt-8 space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card flex items-center gap-4 p-4">
            <div className="h-16 w-16 shrink-0 rounded-xl skeleton" />
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
