"use client";

// Global error boundary UI shown when a route-level error is thrown.
import { useEffect } from "react";

// Renders a user-friendly fallback with a retry action for unexpected errors.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Logs the error to the console for diagnostics whenever it changes.
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          An unexpected error occurred. Please try again.
        </p>
        {/* Retry button that invokes the route reset handler to recover. */}
        <button
          onClick={reset}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-indigo px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-indigo/90"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
