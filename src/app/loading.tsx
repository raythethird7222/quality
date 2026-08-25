// Route-level loading fallback displayed while pages are being loaded.
import { LoadingSpinner } from "@/components/ui/loading";

// Shows a centered spinner and label during navigation/loading.
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-base">
      {/* Centered spinner indicating the route is loading. */}
      <LoadingSpinner size="lg" className="text-brand-gold" />
      {/* Uppercase status label shown beneath the spinner. */}
      <p className="text-sm font-medium tracking-[0.16em] text-text-muted uppercase">
        Loading
      </p>
    </div>
  );
}
