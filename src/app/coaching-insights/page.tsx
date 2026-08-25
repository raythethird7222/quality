"use client";

// Page: placeholder for the upcoming Coaching Insights feature.
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Renders a "coming soon" placeholder for the Coaching Insights section with a back button.
export default function CoachingInsightsPlaceholder() {
  // Provides navigation for the back button.
  const router = useRouter();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-xl font-semibold text-foreground">
        Coaching Insights
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This section is coming soon. It will surface personalized coaching
        recommendations based on evaluation trends.
      </p>
      {/* Back button returns the user to the previous page */}
      <button
        onClick={() => router.back()}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground transition hover:bg-muted"
      >
        <ArrowLeft size={15} />
        Back
      </button>
    </div>
  );
}
