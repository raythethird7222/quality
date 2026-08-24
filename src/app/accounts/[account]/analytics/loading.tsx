"use client";

export default function AnalyticsLoading() {
  return (
    <div className="min-h-full bg-surface-base">
      <div className="mx-auto max-w-[1440px] px-6 py-5 md:px-9">
        <div className="mt-5 mb-6">
          <div className="h-8 w-64 animate-pulse rounded bg-surface-overlay" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-surface-overlay" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-2xl border border-border-default bg-card"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
