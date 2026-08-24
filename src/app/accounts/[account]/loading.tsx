export default function AccountLoading() {
  return (
    <div className="min-h-full bg-surface-base">
      <div className="mx-auto max-w-[1440px] px-6 py-5 md:px-9">
        <div className="flex items-center gap-3 text-[13px] text-text-muted">
          <div className="h-4 w-16 animate-pulse rounded bg-surface-overlay" />
          <span>/</span>
          <div className="h-4 w-20 animate-pulse rounded bg-surface-overlay" />
        </div>
        <div className="mt-5 space-y-6">
          <div className="h-10 w-64 animate-pulse rounded-xl bg-surface-overlay" />
          <div className="h-4 w-96 animate-pulse rounded bg-surface-overlay" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl border border-border-default bg-card"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
