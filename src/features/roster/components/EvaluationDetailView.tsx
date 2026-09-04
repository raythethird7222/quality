"use client";

// Evaluation detail view: read-only review of a single agent evaluation.
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { getAccentColors } from "@/features/accounts/config";
import { useAccent } from "@/features/settings/useAccent";
import { slugToDisplayName } from "@/lib/utils";
import type { Accent, AttributeGroup } from "@/types";

// Props for the evaluation detail view.
type EvaluationDetailViewProps = {
  account: string;
  personName: string;
  evaluationId: string;
  accent: Accent;
  guideline: string;
  groups: AttributeGroup[];
  totalScore: number;
  notes?: string;
  ticketBill?: string;
  evaluationDate?: string;
};

// Main evaluation detail view: header, fields, attribute groups, and notes.
export default function EvaluationDetailView({
  account,
  personName,
  evaluationId,
  accent,
  guideline,
  groups,
  totalScore,
  notes = "",
  ticketBill = "",
  evaluationDate = "",
}: EvaluationDetailViewProps) {
  void evaluationId;
  const selectedAccent = useAccent();
  const accentFull = getAccentColors(selectedAccent);
  const displayName = slugToDisplayName(personName);
  const [activeTab, setActiveTab] = useState(0);
  const percentage =
    totalScore > 0 ? Math.min(100, Math.round(totalScore)).toString() : "--";

  // Per-group checked counts for tab badges.
  const groupCheckedCounts = groups.map(
    (group) => group.clauses.filter((c) => c.checked).length
  );

  return (
    <div className="min-h-full bg-surface-base text-text-primary">
      <div className="w-full px-6 py-5 md:px-9">
        <Breadcrumb
          backHref={`/accounts/${account}/roster/${personName}`}
          backLabel="Back to Calendar"
          segments={[
            { label: account.toUpperCase(), href: `/accounts/${account}` },
            {
              label: displayName,
              href: `/accounts/${account}/roster/${personName}`,
            },
            { label: "Evaluation" },
          ]}
          accent={selectedAccent}
        />

        <div className="mt-4 overflow-hidden rounded-2xl border border-border-default bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border-subtle bg-surface-raised/50 px-6 py-4">
            <h1 className="text-[18px] font-bold text-text-primary">
              Review Analysis Evaluation Details (Read-Only)
            </h1>
            <span
              className={`rounded-full px-4 py-1.5 text-[14px] font-bold ${accentFull.bgLight} ${accentFull.text}`}
            >
              {percentage === "--" ? "--" : `${percentage}%`}
            </span>
          </div>

          <div className="px-6 py-5">
            <div className="mb-5 grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-text-secondary">
                  Target Dynamic Guideline
                </label>
                <select
                  disabled
                  className="w-full appearance-none rounded-lg border border-border-default bg-surface-overlay/50 py-2 pl-3 pr-8 text-[14px] text-text-primary outline-none"
                >
                  <option>{guideline}</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-text-secondary">
                  Evaluation Date
                </label>
                <input
                  type="text"
                  disabled
                  value={evaluationDate}
                  className="w-full rounded-lg border border-border-default bg-surface-overlay/50 px-3 py-2 text-[14px] text-text-primary outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-text-secondary">
                  Ticket / Bill Reference ID
                </label>
                <input
                  type="text"
                  disabled
                  value={ticketBill}
                  placeholder="Ex. TKT-982410"
                  className="w-full rounded-lg border border-border-default bg-surface-overlay/50 px-3 py-2 text-[14px] text-text-primary outline-none placeholder:text-text-muted/60"
                />
              </div>
            </div>

            {/* Attribute groups — tabbed by attribute */}
            {groups.length === 0 ? (
              <div className="flex h-[120px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border-subtle bg-surface-raised/50">
                <p className="text-base font-semibold text-text-primary">
                  No evaluation attributes
                </p>
                <p className="text-sm text-text-muted">
                  Checklist items will appear here once the evaluation is
                  completed.
                </p>
              </div>
            ) : (
              <div>
                {/* Tab bar */}
                <div className="mb-3 flex flex-wrap gap-2">
                  {groups.map((group, i) => {
                    const checkedCount = groupCheckedCounts[i];
                    const allChecked = checkedCount === group.clauses.length;
                    return (
                      <button
                        key={group.code}
                        type="button"
                        onClick={() => setActiveTab(i)}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition ${
                          activeTab === i
                            ? `${accentFull.border} ${accentFull.bgLight} ${accentFull.text}`
                            : "border-border-default bg-surface-raised/40 text-text-secondary hover:bg-surface-overlay"
                        }`}
                      >
                        {group.code}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            allChecked
                              ? `${accentFull.bg} text-white`
                              : "bg-surface-overlay text-text-muted"
                          }`}
                        >
                          {checkedCount}/{group.clauses.length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Active tab panel */}
                <div className="overflow-hidden rounded-lg border border-border-default">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border-subtle bg-surface-raised/30">
                        <th className="w-10 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-text-muted">
                          ✓
                        </th>
                        <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                          Code
                        </th>
                        <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups[activeTab].clauses.map((clause) => (
                        <tr
                          key={clause.code}
                          className="border-b border-border-subtle/50 transition hover:bg-surface-overlay/30"
                        >
                          <td className="px-3 py-2 text-center align-top">
                            <input
                              type="checkbox"
                              checked={clause.checked}
                              disabled
                              className="h-4 w-4 rounded border-border-default accent-current"
                              style={{ accentColor: "var(--app-accent)" }}
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <span className="text-[14px] font-bold text-text-primary">
                              {clause.code}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top">
                            {clause.description ? (
                              <span className="text-[14px] italic leading-relaxed text-text-secondary">
                                {clause.description}
                              </span>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mt-5 flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-text-secondary">
                Audit Case Structural Analysis Notes &amp; Observations
              </label>
              <textarea
                disabled
                rows={3}
                value={notes}
                placeholder="No notes recorded for this evaluation."
                className="w-full resize-none rounded-lg border border-border-default bg-surface-overlay/50 px-3 py-2 text-[14px] text-text-primary outline-none placeholder:text-text-muted/60"
              />
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-4">
              <Link
                href={`/accounts/${account}/roster/${personName}`}
                className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-card px-4 py-2 text-sm font-semibold text-text-secondary transition hover:bg-surface-overlay"
              >
                <ArrowLeft size={14} />
                Back
              </Link>
              <Link
                href={`/accounts/${account}/roster/${personName}`}
                className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-card px-4 py-2 text-sm font-semibold text-text-secondary transition hover:bg-surface-overlay"
              >
                <RotateCcw size={14} />
                Terminate Framework
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
