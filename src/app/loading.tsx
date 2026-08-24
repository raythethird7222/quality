import { LoadingSpinner } from "@/components/ui/loading";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-base">
      <LoadingSpinner size="lg" className="text-brand-gold" />
      <p className="text-sm font-medium tracking-[0.16em] text-text-muted uppercase">
        Loading
      </p>
    </div>
  );
}
