"use client";

// Breadcrumb navigation with a back link and accent-colored segment trail.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Accent } from "@/types";
import { getAccentColors } from "@/features/accounts/config";

// Shape of a single breadcrumb segment and the component's props.
type BreadcrumbSegment = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  backHref?: string;
  backLabel?: string;
  segments: BreadcrumbSegment[];
  accent: Accent;
};

// Renders the back link plus the hierarchical segment trail.
export default function Breadcrumb({
  backHref,
  backLabel = "Return back",
  segments,
  accent,
}: BreadcrumbProps) {
  // Resolve accent color tokens used for styling links and labels.
  const a = getAccentColors(accent);
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
    } else if (backHref) {
      router.push(backHref);
    }
  }

  return (
    <nav
      className="flex flex-wrap items-center gap-3 text-[13px]"
      aria-label="Breadcrumb"
    >
      {/* Back navigation link */}
      <button
        onClick={handleBack}
        className={`inline-flex items-center gap-2 rounded-lg border ${a.border} bg-card px-3.5 py-2 font-medium ${a.text} transition ${a.hoverBg}`}
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </button>
      {/* Hierarchical segment trail leading to the current page */}
      <div className="flex items-center gap-2 text-text-muted">
        <Link
          href="/dashboard"
          className="transition hover:text-brand-indigo"
        >
          Home
        </Link>
        {segments.map((segment, i) => (
          <span key={i} className="flex items-center gap-2">
            <span>/</span>
            {segment.href ? (
              <Link
                href={segment.href}
                className={`transition ${a.hoverBg.replace("hover:", "hover:")}`}
              >
                {segment.label}
              </Link>
            ) : (
              <span className={`font-semibold ${a.text}`}>
                {segment.label}
              </span>
            )}
          </span>
        ))}
      </div>
    </nav>
  );
}
