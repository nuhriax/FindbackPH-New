export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mx-auto h-5 w-44 skeleton rounded-full" />
        <div className="mx-auto mt-4 h-10 w-80 max-w-full skeleton" />
        <div className="mt-8 h-14 w-full skeleton" />
      </div>

      <div className="mt-4 space-y-2">
        <div className="h-6 w-40 skeleton" />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-72 skeleton" />
        ))}
      </div>
    </div>
  );
}