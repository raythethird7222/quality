"use client";

// Reusable pagination controls: page-size dropdown, prev/next buttons, and page info.
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 100, 500, 0] as const;
// 0 represents "All" rows.

type PaginationProps = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
};

export default function Pagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  className,
}: PaginationProps) {
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalItems / pageSize);
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const start = pageSize === 0 ? 1 : (safePage - 1) * pageSize + 1;
  const end = pageSize === 0 ? totalItems : Math.min(safePage * pageSize, totalItems);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-border-default px-4 py-3 text-[12px] text-text-secondary",
        className
      )}
    >
      {/* Left: page-size dropdown + row count */}
      <div className="flex items-center gap-2">
        <span className="text-text-muted">Show</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-md border border-border-default bg-card px-2 py-1 text-[12px] text-text-primary outline-none"
        >
          {PAGE_SIZE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt === 0 ? "All" : opt}
            </option>
          ))}
        </select>
        <span className="text-text-muted">
          {totalItems === 0
            ? "0 entries"
            : `${start}–${end} of ${totalItems}`}
        </span>
      </div>

      {/* Right: prev / next buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="inline-flex items-center gap-1 rounded-md border border-border-default bg-card px-2.5 py-1.5 text-[11px] font-medium text-text-secondary transition hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={12} />
          Prev
        </button>
        <span className="px-2 text-[11px] font-semibold text-text-primary">
          {safePage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="inline-flex items-center gap-1 rounded-md border border-border-default bg-card px-2.5 py-1.5 text-[11px] font-medium text-text-secondary transition hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

// Helper: slices an array for the current page.
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  if (pageSize === 0) return items;
  const start = (Math.max(1, page) - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
