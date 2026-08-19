export default function FoundItemsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      <div className="h-12 w-80 max-w-full skeleton" />
      <div className="mt-4 h-10 w-1/2 max-w-full skeleton" />

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-80 skeleton" />
        ))}
      </div>
    </div>
  );
}