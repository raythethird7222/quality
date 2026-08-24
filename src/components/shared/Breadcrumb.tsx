"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Accent } from "@/types";
import { getAccentColors } from "@/features/accounts/config";

type BreadcrumbSegment = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  backHref: string;
  backLabel?: string;
  segments: BreadcrumbSegment[];
  accent: Accent;
};

export default function Breadcrumb({
  backHref,
  backLabel = "Return back",
  segments,
  accent,
}: BreadcrumbProps) {
  const a = getAccentColors(accent);

  return (
    <nav
      className="flex flex-wrap items-center gap-3 text-[13px]"
      aria-label="Breadcrumb"
    >
      <Link
        href={backHref}
        className={`inline-flex items-center gap-2 rounded-lg border ${a.border} bg-card px-3.5 py-2 font-medium ${a.text} transition ${a.hoverBg}`}
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>
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
