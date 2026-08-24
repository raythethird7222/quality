"use client";

import { cn } from "@/lib/utils";

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
