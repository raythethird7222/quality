import { LoadingSpinner } from "@/components/ui/loading";

export default function EvaluationLoading() {
  return (
    <div className="flex min-h-full items-center justify-center bg-surface-base py-24">
      <LoadingSpinner size="lg" className="text-brand-gold" />
    </div>
  );
}
