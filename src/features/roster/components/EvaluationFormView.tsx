"use client";

// Interactive evaluation form: lets an assigned evaluator tick the checklist
// clauses fetched from the account-specific parameter table and save a new evaluation.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CheckSquare, Phone, RotateCcw } from "lucide-react";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { getAccentColors } from "@/features/accounts/config";
import { useAccent } from "@/features/settings/useAccent";
import { slugToDisplayName } from "@/lib/utils";
import type { Accent } from "@/types";
import type { ChecklistGroup } from "@/lib/db/quality";

// Props for the evaluation form view.
type EvaluationFormViewProps = {
  account: string;
  personName: string;
  accent: Accent;
  guideline: string;
  guidelineOptions: string[];
  groups: ChecklistGroup[];
  totalScore: number;
  day?: string;
  month?: string;
  year?: string;
  viciLink?: string | null;
};

// Main interactive evaluation form view.
export default function EvaluationFormView({
  account,
  personName,
  accent,
  guideline,
  guidelineOptions,
  groups,
  totalScore,
  day,
  month,
  year,
  viciLink,
}: EvaluationFormViewProps) {
  const a = getAccentColors(accent);
  const selectedAccent = useAccent();
  const accentFull = getAccentColors(selectedAccent);
  const router = useRouter();
  const displayName = slugToDisplayName(personName);

  function handleGuidelineChange(nextGuideline: string) {
    const params = new URLSearchParams(window.location.search);
    params.set("guideline", nextGuideline);
    router.replace(`${window.location.pathname}?${params.toString()}`);
  }

  // Flatten checklist into a map of parameterId -> checked.
  // All items start unchecked; checking an item marks a deduction.
  const initialChecked: Record<number, boolean> = {};
  for (const group of groups) {
    for (const clause of group.clauses) initialChecked[clause.id] = false;
  }
  const [checked, setChecked] = useState<Record<number, boolean>>(initialChecked);

  const [activeTab, setActiveTab] = useState(0);
  const [ticketBill, setTicketBill] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Score earned by the currently-checked clauses (deductions).
  const checkedScore = groups.reduce(
    (sum, group) =>
      sum +
      group.clauses.reduce(
        (g, clause) => (checked[clause.id] ? g + clause.score : g),
        0
      ),
    0
  );
  // Percentage starts at 100%; checked items deduct their score.
  const percentage =
    totalScore > 0 ? Math.max(0, Math.round(100 - (checkedScore / totalScore) * 100)) : 100;

  // Per-group checked counts for tab badges.
  const groupCheckedCounts = groups.map(
    (group) => group.clauses.filter((c) => checked[c.id]).length
  );

  // Build a date string from the calendar's day/month/year.
  const evalDate =
    day && month && year
      ? `${year}-${String(Number(month) + 1).padStart(2, "0")}-${String(
          Number(day)
        ).padStart(2, "0")}`
      : new Date().toISOString().slice(0, 10);

  async function handleSave() {
    setError(null);

    // Calculate score, guarding against division by zero.
    const qaScore =
      totalScore > 0
        ? Math.max(0, Math.min(100, Math.round(100 - (checkedScore / totalScore) * 100)))
        : 100;

    setSaving(true);
    try {
      const res = await fetch(
        `/api/accounts/${account}/evaluations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentName: displayName,
            guideline,
            evaluationDate: evalDate,
            qaScore,
            ticketBill: ticketBill || undefined,
            notes: notes || undefined,
            checked: groups.flatMap((g) =>
              g.clauses.map((c) => ({
                parameterId: c.id,
                checked: checked[c.id] ?? false,
              }))
            ),
          }),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save evaluation");
      }
      router.push(`/accounts/${account}/roster/${personName}`);
    } catch (err) {
      console.error("Save evaluation error:", err);
      setError(err instanceof Error ? err.message : "Failed to save evaluation");
    } finally {
      setSaving(false);
    }
  }

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
            { label: "Evaluate" },
          ]}
          accent={selectedAccent}
        />

        <div className="mt-4 overflow-hidden rounded-2xl border border-border-default bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border-subtle bg-surface-raised/50 px-6 py-4">
            <h1 className="text-[18px] font-bold text-text-primary">
              Create Evaluation ({guideline})
            </h1>
            <span
              className={`rounded-full px-4 py-1.5 text-[14px] font-bold ${accentFull.bgLight} ${accentFull.text}`}
            >
              {percentage}%
            </span>
          </div>

          <div className="px-6 py-5">
            <div className="mb-5 grid grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-text-secondary">
                  Target Dynamic Guideline
                </label>
                {guidelineOptions.length > 1 ? (
                  <select
                    value={guideline}
                    onChange={(event) => handleGuidelineChange(event.target.value)}
                    className="rounded-lg border border-border-default bg-surface-overlay/50 px-3 py-2 text-[14px] text-text-primary outline-none"
                  >
                    {guidelineOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-lg border border-border-default bg-surface-overlay/50 px-3 py-2 text-[14px] text-text-primary">
                    {guideline}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-text-secondary">
                  Migration / Load Date
                </label>
                <input
                  type="text"
                  value={evalDate}
                  disabled
                  className="w-full rounded-lg border border-border-default bg-surface-overlay/50 px-3 py-2 text-[14px] text-text-primary outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-text-secondary">
                  Ticket / Bill Reference ID
                </label>
                <input
                  type="text"
                  value={ticketBill}
                  onChange={(e) => setTicketBill(e.target.value)}
                  placeholder="Ex. TKT-982410"
                  className="w-full rounded-lg border border-border-default bg-surface-overlay/50 px-3 py-2 text-[14px] text-text-primary outline-none placeholder:text-text-muted/60"
                />
              </div>
              {viciLink ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-text-secondary">
                    Agent VICI Link
                  </label>
                  <a
                    href={viciLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center gap-2 rounded-lg border ${accentFull.border} bg-card px-3 py-2 text-sm font-semibold ${accentFull.text} transition hover:bg-surface-overlay`}
                  >
                    <Phone size={14} />
                    Open VICI
                  </a>
                </div>
              ) : null}
            </div>

            {/* Interactive checklist — tabbed by attribute */}
            {groups.length === 0 ? (
              <div className="flex h-[120px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border-subtle bg-surface-raised/50">
                <p className="text-base font-semibold text-text-primary">
                  No evaluation checklist
                </p>
                <p className="text-sm text-text-muted">
                  No active parameters found for this guideline.
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
                          <input
                            type="checkbox"
                            ref={(el) => {
                              if (el) {
                                const group = groups[activeTab];
                                const allChecked = group.clauses.every((c) => checked[c.id]);
                                const someChecked = group.clauses.some((c) => checked[c.id]);
                                el.indeterminate = someChecked && !allChecked;
                              }
                            }}
                            checked={groups[activeTab].clauses.every((c) => checked[c.id])}
                            onChange={(e) => {
                              const allChecked = groups[activeTab].clauses.every((c) => checked[c.id]);
                              setChecked((prev) => {
                                const next = { ...prev };
                                for (const c of groups[activeTab].clauses) {
                                  next[c.id] = !allChecked;
                                }
                                return next;
                              });
                            }}
                            className="h-4 w-4 rounded border-border-default accent-current"
                            style={{ accentColor: "var(--app-accent)" }}
                          />
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
                          key={clause.id}
                          className="border-b border-border-subtle/50 transition hover:bg-surface-overlay/30"
                        >
                          <td className="px-3 py-2 text-center align-top">
                            <input
                              type="checkbox"
                              checked={checked[clause.id] ?? false}
                              onChange={(e) =>
                                setChecked((prev) => ({
                                  ...prev,
                                  [clause.id]: e.target.checked,
                                }))
                              }
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
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detail core transactional errors and development actionable paths..."
                className="w-full resize-none rounded-lg border border-border-default bg-surface-overlay/50 px-3 py-2 text-[14px] text-text-primary outline-none placeholder:text-text-muted/60"
              />
            </div>

            {error ? (
              <p className="mt-3 text-sm font-semibold text-red-500">
                {error}
              </p>
            ) : null}

            {/* Actions */}
            <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-4">
              <button
                type="button"
                onClick={() => router.push(`/accounts/${account}/roster/${personName}`)}
                className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-card px-4 py-2 text-sm font-semibold text-text-secondary transition hover:bg-surface-overlay"
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push(`/accounts/${account}/roster/${personName}`)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-card px-4 py-2 text-sm font-semibold text-text-secondary transition hover:bg-surface-overlay"
                >
                  <RotateCcw size={14} />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || groups.length === 0}
                  className={`inline-flex items-center gap-2 rounded-lg ${accentFull.bg} px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <CheckSquare size={14} />
                  {saving ? "Saving..." : "Save Evaluation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
