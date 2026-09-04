// Loading UI shown while the dashboard route is being server-rendered.
import { LoadingSpinner } from "@/components/ui/loading";

// Renders the dashboard loading state with a spinner and status message.
export default function DashboardLoading() {
  return (
    <main className="min-h-full bg-surface-base px-6 py-5 text-text-primary md:px-9">
      {/* Centered loading layout with spinner and status text */}
      <div className="w-full">
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <LoadingSpinner size="lg" className="text-brand-gold" />
          <p className="text-sm font-medium tracking-[0.16em] text-text-muted uppercase">
            Loading Dashboard
          </p>
        </div>
      </div>
    </main>
  );
}
