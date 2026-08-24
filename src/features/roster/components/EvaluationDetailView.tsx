"use client";

import Link from "next/link";
import { Phone, RotateCcw } from "lucide-react";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { getAccentColors } from "@/features/accounts/config";
import { slugToDisplayName } from "@/lib/utils";
import type { Accent, AttributeGroup } from "@/types";

type EvaluationDetailViewProps = {
  account: string;
  personName: string;
  evaluationId: string;
  accent: Accent;
};

const mockGroups: AttributeGroup[] = [];

export default function EvaluationDetailView({
  account,
  personName,
  evaluationId,
  accent,
}: EvaluationDetailViewProps) {
  void evaluationId;
  const a = getAccentColors(accent);
  const displayName = slugToDisplayName(personName);

  return (
    <div className="min-h-full bg-surface-base text-text-primary">
      <div className="mx-auto max-w-[1440px] px-6 py-5 md:px-9">
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
          accent={accent}
        />

        {/* Form Card */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-border-default bg-card shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-subtle bg-surface-raised/50 px-6 py-4">
            <h1 className="text-[16px] font-bold text-text-primary">
              Review Analysis Evaluation Details (Read-Only)
            </h1>
            <span
              className={`rounded-full px-3 py-1 text-[13px] font-bold ${a.bgLight} ${a.text}`}
            >
              {mockGroups.length > 0 ? "100%" : "--"}
            </span>
          </div>

          <div className="px-6 py-5">
            {/* Top fields */}
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-text-secondary">
                  Target Dynamic Guideline
                </label>
                <select
                  disabled
                  className="w-full appearance-none rounded-lg border border-border-default bg-surface-overlay/50 py-2 pl-3 pr-8 text-[13px] text-text-primary outline-none"
                >
                  <option>PHONE</option>
                  <option>CHAT</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-text-secondary">
                  Ticket / Bill Reference ID
                </label>
                <input
                  type="text"
                  disabled
                  placeholder="Ex. TKT-982410"
                  className="w-full rounded-lg border border-border-default bg-surface-overlay/50 px-3 py-2 text-[13px] text-text-primary outline-none placeholder:text-text-muted/60"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-text-secondary">
                  AGENT VICI LINK
                </label>
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-surface-overlay/50 px-3 py-2 text-[13px] font-semibold text-text-secondary"
                >
                  <Phone size={14} />
                  Open VICI
                </button>
              </div>
            </div>

            {/* Attribute groups */}
            <div className="space-y-4">
              {mockGroups.length === 0 ? (
                <div className="flex h-[220px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-subtle bg-surface-raised/50">
                  <p className="text-sm font-semibold text-text-primary">
                    No evaluation attributes
                  </p>
                  <p className="text-[12px] text-text-muted">
                    Checklist items will appear here once the evaluation is
                    completed.
                  </p>
                </div>
              ) : (
                mockGroups.map((group) => (
                  <div
                    key={group.code}
                    className="rounded-xl border border-border-default bg-surface-raised/30"
                  >
                    <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
                      <h3
                        className={`text-[14px] font-bold ${a.text}`}
                      >
                        {group.code}
                      </h3>
                      <span className="rounded-full bg-surface-overlay px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                        Compound System Deductions Applied (
                        {group.bracket})
                      </span>
                    </div>

                    <div className="divide-y divide-border-subtle">
                      {group.clauses.map((clause) => (
                        <label
                          key={clause.code}
                          className="flex cursor-default items-start gap-3 px-4 py-3 transition hover:bg-surface-overlay/30"
                        >
                          <input
                            type="checkbox"
                            checked={clause.checked}
                            disabled
                            className="mt-0.5 h-4 w-4 rounded border-border-default accent-current"
                            style={{ accentColor: "var(--app-accent)" }}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[13px] font-bold text-text-primary">
                              {clause.code}
                            </span>
                            <p className="mt-1 whitespace-pre-wrap border-l-2 border-border-subtle pl-3 text-[12px] italic leading-relaxed text-text-secondary">
                              {clause.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Notes */}
            <div className="mt-6 flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-text-secondary">
                Audit Case Structural Analysis Notes &amp; Observations
              </label>
              <textarea
                disabled
                rows={4}
                placeholder="Detail core transactional errors and development actionable paths..."
                className="w-full resize-none rounded-lg border border-border-default bg-surface-overlay/50 px-3 py-2 text-[13px] text-text-primary outline-none placeholder:text-text-muted/60"
              />
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-border-subtle pt-5">
              <Link
                href={`/accounts/${account}/roster/${personName}`}
                className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-card px-4 py-2 text-[13px] font-semibold text-text-secondary transition hover:bg-surface-overlay"
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
