// Instant skeleton shown while a (dynamic) page fetches on the server.
// Gives immediate feedback on navigation instead of a frozen old page.
export default function Loading() {
  return (
    <>
      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 sm:px-6">
        <div className="h-10 w-44 animate-pulse rounded-xl bg-white/[0.05]" />
        <div className="h-9 w-9 animate-pulse rounded-full bg-white/[0.05]" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="h-8 w-52 animate-pulse rounded-lg bg-white/[0.05]" />

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-line bg-white/[0.03]"
              />
            ))}
          </div>

          <div className="mt-5 h-72 animate-pulse rounded-2xl border border-line bg-white/[0.03]" />
        </div>
      </div>
    </>
  );
}
