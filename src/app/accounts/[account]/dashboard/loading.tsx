"use client";

export default function AccountDashboardLoading() {
  return (
    <div className="min-h-full bg-surface-base">
      <div className="mx-auto max-w-[1440px] px-6 py-5 md:px-9">
        <div className="flex items-center gap-3 text-[13px] text-text-muted">
          <div className="h-4 w-16 animate-pulse rounded bg-surface-overlay" />
          <span>/</span>
          <div className="h-4 w-20 animate-pulse rounded bg-surface-overlay" />
          <span>/</span>
          <div className="h-4 w-24 animate-pulse rounded bg-surface-overlay" />
        </div>
        <div className="mt-5 space-y-6">
          <div className="h-10 w-80 animate-pulse rounded-xl bg-surface-overlay" />
          <div className="rounded-2xl border border-border-default bg-card p-6">
            <div className="h-8 w-48 animate-pulse rounded bg-surface-overlay" />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl bg-surface-overlay"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
