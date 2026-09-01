"use client";

// Shared loading indicators: spinner plus page and section placeholders.
import { cn } from "@/lib/utils";

// Reusable spinner with small/medium/large size variants.
export function LoadingSpinner({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-4",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-border border-t-brand-indigo",
          sizes[size]
        )}
      />
    </div>
  );
}

// Full-area page-level loading state with a large spinner and label.
export function PageLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-text-secondary">Loading...</p>
      </div>
    </div>
  );
}

// Inline section loading state with an optional message.
export function SectionLoading({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="md" />
        {message && (
          <p className="text-sm text-text-secondary">{message}</p>
        )}
      </div>
    </div>
  );
}
