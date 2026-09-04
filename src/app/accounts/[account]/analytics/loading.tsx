"use client";

// Loading skeleton shown while the account analytics page is being fetched.
export default function AnalyticsLoading() {
  return (
    <div className="min-h-full bg-surface-base">
      {/* Page container with responsive horizontal padding */}
      <div className="w-full px-6 py-5 md:px-9">
        {/* Title and subtitle placeholder rows */}
        <div className="mt-5 mb-6">
          <div className="h-8 w-64 animate-pulse rounded bg-surface-overlay" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-surface-overlay" />
        </div>
        {/* Chart placeholders rendered as a two-column grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Render two pulsing placeholder cards for the analytics charts */}
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
