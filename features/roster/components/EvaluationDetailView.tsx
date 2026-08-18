"use client";

import Link from "next/link";
import { ArrowLeft, Phone, RotateCcw } from "lucide-react";

type EvaluationDetailViewProps = {
  account: string;
  personName: string;
  evaluationId: string;
  accent: "gold" | "indigo" | "crimson" | "charcoal";
};

const accentColor = {
  gold: { text: "text-brand-gold", bg: "bg-brand-gold", border: "border-brand-gold", hoverBg: "hover:bg-brand-gold/10", bgLight: "bg-brand-gold/10", hex: "#C8A54B" },
  indigo: { text: "text-brand-indigo", bg: "bg-brand-indigo", border: "border-brand-indigo", hoverBg: "hover:bg-brand-indigo/10", bgLight: "bg-brand-indigo/10", hex: "#2F6798" },
  crimson: { text: "text-brand-crimson", bg: "bg-brand-crimson", border: "border-brand-crimson", hoverBg: "hover:bg-brand-crimson/10", bgLight: "bg-brand-crimson/10", hex: "#ED1C25" },
  charcoal: { text: "text-brand-charcoal", bg: "bg-brand-charcoal", border: "border-brand-charcoal", hoverBg: "hover:bg-brand-charcoal/10", bgLight: "bg-brand-charcoal/10", hex: "#363435" },
} as const;

type Clause = { code: string; description: string; checked: boolean };
type AttributeGroup = { code: string; bracket: string; clauses: Clause[] };

const mockGroups: AttributeGroup[] = [
  {
    code: "INF", bracket: "5 Points Bracket", clauses: [
      { code: "INF1", description: "When pulling up an account, the ninja should use these Primary Information:\n—Email address/Alternative email address\n—Phone number\n—Account number (if provided)\n—Last 4 digits of the card", checked: true },
      { code: "INF2", description: "The ninja should provide the correct and exact information (the account was pulled up or not pulled up/verified)", checked: true },
      { code: "INF3", description: "The ninja should provide information that can be found on the ticket", checked: true },
    ],
  },
  {
    code: "CAN", bracket: "15 Points Bracket", clauses: [
      { code: "CAN1", description: "The ninja must cancel all active and correct subscriptions referring to the charge on the transaction history", checked: true },
      { code: "CAN2", description: "The ninja must not cancel a different subscription other than what is on the ticket", checked: false },
    ],
  },
  {
    code: "PRB", bracket: "10 Points Bracket", clauses: [
      { code: "PRB1", description: "Before canceling, the Ninja should provide and confirm the exact date and amount of the charge(s)", checked: true },
      { code: "PRB2", description: "3 Months Rule:\n—The ninja should probe and clarify the different/multiple charges on the ticket within 3 months", checked: false },
    ],
  },
  {
    code: "DOC", bracket: "15 Points Bracket", clauses: [
      { code: "DOC1", description: "No documentation at all/missing chat transcript on both chat monitoring sheets and on the Admin", checked: false },
      { code: "DOC2", description: "The documentation heading must correspond with the call outcome (SC, AC, USTC, NC, RRW, NMI)", checked: true },
    ],
  },
];

export default function EvaluationDetailView({ account, personName, evaluationId, accent }: EvaluationDetailViewProps) {
  const a = accentColor[accent];

  const displayName = personName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <div className="mx-auto max-w-[1100px] px-6 py-5 md:px-9">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-3 text-[13px]" aria-label="Breadcrumb">
          <Link
            href={`/${account}/roster/${personName}`}
            className={`inline-flex items-center gap-2 rounded-lg border ${a.border} bg-white px-3.5 py-2 font-medium ${a.text} transition ${a.hoverBg}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Calendar
          </Link>
          <div className="flex items-center gap-2 text-text-muted">
            <Link href="/" className="transition hover:text-brand-indigo">Home</Link>
            <span>/</span>
            <Link href={`/${account}`} className={`transition hover:${a.text}`}>{account.toUpperCase()}</Link>
            <span>/</span>
            <Link href={`/${account}/roster/${personName}`} className={`transition hover:${a.text}`}>{displayName}</Link>
            <span>/</span>
            <span className={`font-semibold ${a.text}`}>Evaluation</span>
          </div>
        </nav>

        {/* Form Card */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-border-default bg-white shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-subtle bg-surface-raised/50 px-6 py-4">
            <h1 className="text-[16px] font-bold text-text-primary">
              Review Analysis Evaluation Details (Read-Only)
            </h1>
            <span className={`rounded-full px-3 py-1 text-[13px] font-bold ${a.bgLight} ${a.text}`}>
              100%
            </span>
          </div>

          <div className="px-6 py-5">
            {/* Top fields */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-text-secondary">Target Dynamic Guideline</label>
                <select
                  disabled
                  className="w-full appearance-none rounded-lg border border-border-default bg-surface-overlay/50 py-2 pl-3 pr-8 text-[13px] text-text-primary outline-none"
                >
                  <option>PHONE</option>
                  <option>CHAT</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-text-secondary">Ticket / Bill Reference ID</label>
                <input
                  type="text"
                  disabled
                  placeholder="Ex. TKT-982410"
                  className="w-full rounded-lg border border-border-default bg-surface-overlay/50 px-3 py-2 text-[13px] text-text-primary outline-none placeholder:text-text-muted/60"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-text-secondary">AGENT VICI LINK</label>
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
              {mockGroups.map((group) => (
                <div key={group.code} className="rounded-xl border border-border-default bg-surface-raised/30">
                  {/* Group header */}
                  <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
                    <h3 className={`text-[14px] font-bold ${a.text}`}>{group.code}</h3>
                    <span className="rounded-full bg-surface-overlay px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                      Compound System Deductions Applied ({group.bracket})
                    </span>
                  </div>

                  {/* Clauses */}
                  <div className="divide-y divide-border-subtle">
                    {group.clauses.map((clause) => (
                      <label
                        key={clause.code}
                        className="flex items-start gap-3 px-4 py-3 transition hover:bg-surface-overlay/30 cursor-default"
                      >
                        <input
                          type="checkbox"
                          checked={clause.checked}
                          disabled
                          className={`mt-0.5 h-4 w-4 rounded border-border-default accent-current`}
                          style={{ accentColor: a.hex }}
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[13px] font-bold text-text-primary">{clause.code}</span>
                          <p className="mt-1 whitespace-pre-wrap border-l-2 border-border-subtle pl-3 text-[12px] leading-relaxed text-text-secondary italic">
                            {clause.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
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
                className="w-full rounded-lg border border-border-default bg-surface-overlay/50 px-3 py-2 text-[13px] text-text-primary outline-none placeholder:text-text-muted/60 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-border-subtle pt-5">
              <Link
                href={`/${account}/roster/${personName}`}
                className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-white px-4 py-2 text-[13px] font-semibold text-text-secondary transition hover:bg-surface-overlay"
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
