export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl p-6 md:p-10 min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
          <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
          <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
      <div className="mt-6 h-14 animate-pulse rounded-lg bg-muted" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
      <div className="mt-6 h-80 animate-pulse rounded-lg bg-muted" />
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-60 animate-pulse rounded-lg bg-muted" />
        <div className="h-60 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
        <div className="lg:col-span-2 h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
