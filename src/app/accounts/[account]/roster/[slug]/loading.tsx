// Loading spinner shown while a person's roster calendar page is being fetched.
import { LoadingSpinner } from "@/components/ui/loading";

export default function RosterLoading() {
  return (
    <div className="flex min-h-full items-center justify-center bg-surface-base py-24">
      {/* Centered full-height container showing the large loading spinner */}
      <LoadingSpinner size="lg" className="text-brand-gold" />
    </div>
  );
}
