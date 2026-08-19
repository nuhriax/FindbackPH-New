export default function ItemDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="h-4 w-24 skeleton rounded-full" />

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="aspect-[4/3] skeleton" />

          <div className="mt-6 flex gap-2">
            <div className="h-6 w-20 skeleton rounded-full" />
            <div className="h-6 w-16 skeleton rounded-full" />
          </div>

          <div className="mt-4 h-8 w-2/3 skeleton" />
          <div className="mt-4 h-4 w-1/2 skeleton" />

          <div className="mt-6 space-y-4">
            <div className="card h-28 p-6">
              <div className="h-4 w-24 skeleton" />
              <div className="mt-3 space-y-2">
                <div className="h-3 w-full skeleton" />
                <div className="h-3 w-5/6 skeleton" />
              </div>
            </div>
            <div className="card h-24 p-6">
              <div className="h-4 w-32 skeleton" />
              <div className="mt-3 h-2 w-3/4 skeleton" />
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <div className="h-4 w-20 skeleton" />
            <div className="mt-2 h-5 w-28 skeleton" />
            <div className="mt-2 h-3 w-24 skeleton" />
            <div className="mt-4 space-y-2">
              <div className="h-10 w-full skeleton" />
              <div className="h-10 w-full skeleton" />
            </div>
          </div>
          <div className="card h-16 p-4" />
        </aside>
      </div>
    </div>
  );
}