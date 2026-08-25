"use client";

// Account framework view: ops dashboard with metrics, performance, and rosters.
import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleChevronRight,
  ClipboardList,
  Settings,
  ShieldAlert,
  Trophy,
  UsersRound,
} from "lucide-react";
import AssignmentModal from "@/components/ui/assignment-modal";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { getAccentColors } from "@/features/accounts/config";
import { useAccent } from "@/features/settings/useAccent";
import type { AgentPerformance } from "@/types";

// Props for the account framework dashboard view.
type AccountFrameworkViewProps = {
  account: string;
  qaName: string;
  people: AgentPerformance[];
  totalEvaluations?: number;
  dailyTeamQaScore?: string;
  failedEvaluations?: number;
  qaList: string[];
  lobOptions: string[];
  teamLeads: string[];
  agentRows: {
    name: string;
    lob: string;
    coach: string;
    evaluator: string;
    teamLead: string;
    status: string;
  }[];
};

// Main account framework view: header, timeline, metrics, and roster panels.
export default function AccountFrameworkView({
  account,
  qaName,
  people,
  totalEvaluations,
  dailyTeamQaScore,
  failedEvaluations,
  qaList,
  lobOptions,
  teamLeads,
  agentRows,
}: AccountFrameworkViewProps) {
  // Controls visibility of the timeline date picker popover.
  const [calendarOpen, setCalendarOpen] = useState(false);
  // Controls visibility of the QA assignment modal.
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  // Normalize account name into a URL-safe slug for navigation links.
  const unit = account.toLowerCase();
  // Resolve the active theme accent and its mapped color classes.
  const selectedAccent = useAccent();
  const a = getAccentColors(selectedAccent);

  return (
    <div className="min-h-full bg-surface-base text-text-primary">
      <div className="mx-auto max-w-[1440px] px-6 py-5 md:px-9">
        <Breadcrumb
          backHref="/dashboard"
          segments={[
            { label: account },
            { label: "Dashboard" },
          ]}
          accent={selectedAccent}
        />

        {/* Main Card */}
        <section className="mt-5 rounded-2xl border border-border-default bg-card p-6 shadow-sm md:p-7">
          {/* Header Row */}
          <header className="flex flex-col justify-between gap-4 border-b border-border-subtle pb-5 md:flex-row md:items-center">
            <div>
              <h1 className="text-[22px] font-bold tracking-tight text-text-primary">
                Account Framework View
                <span className="mx-1.5 text-text-muted">·</span>
                <span className={a.text}>{account}</span>
                <span className="mx-1.5 text-text-muted">·</span>
                {qaName}
              </h1>
              <p className="mt-1 text-[13px] text-text-secondary">
                Operational performance tracking and evaluation management
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/accounts/${unit}/analytics`}
                className={`inline-flex items-center gap-2 rounded-lg ${a.bg} px-5 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-90`}
              >
                <BarChart3 className="h-4 w-4" />
                View Team QA Analytics
              </Link>
              <button
                type="button"
                onClick={() => setAssignmentOpen(true)}
                className={`inline-flex items-center gap-2 rounded-lg border ${a.border} bg-card px-5 py-2.5 text-[13px] font-semibold ${a.text} transition ${a.hoverBg}`}
              >
                <Settings className="h-4 w-4" />
                QA Assignment
              </button>
            </div>
          </header>

          {/* Timeline Navigator */}
          <section
            className="mt-5 overflow-hidden rounded-xl border border-border-subtle"
            aria-label="Date navigation"
          >
            <div className="flex flex-wrap items-center justify-center gap-3 bg-surface-raised px-4 py-3">
              <button
                type="button"
                onClick={() => alert("Previous Day")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border-default bg-card px-3.5 py-2 text-[12px] font-medium text-text-primary transition hover:border-border-accent hover:shadow-sm"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous Day
              </button>

              <div className="relative">
                <button
                  type="button"
                  // Toggle the calendar popover open/closed.
                  onClick={() => setCalendarOpen((o) => !o)}
                  className={`inline-flex items-center gap-2 rounded-lg border ${a.border} bg-card px-4 py-2 text-[13px] font-bold ${a.text} transition hover:shadow-sm`}
                >
                  Aug 15, 2026
                  <CalendarDays className="h-3.5 w-3.5" />
                </button>

                {calendarOpen && (
                  <div className="absolute left-1/2 z-20 mt-2 w-[260px] -translate-x-1/2 rounded-xl border border-border-default bg-card p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between text-sm font-semibold text-text-primary">
                      <button
                        type="button"
                        onClick={() => alert("Prev Month")}
                        className="rounded p-1 transition hover:bg-surface-overlay"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      August 2026
                      <button
                        type="button"
                        onClick={() => alert("Next Month")}
                        className="rounded p-1 transition hover:bg-surface-overlay"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-semibold text-text-muted">
                      <div>Su</div>
                      <div>Mo</div>
                      <div>Tu</div>
                      <div>We</div>
                      <div>Th</div>
                      <div>Fr</div>
                      <div>Sa</div>
                    </div>
                     <div className="grid grid-cols-7 gap-0.5 text-center text-[12px] text-text-primary">
                       {/* Render a selectable day cell for each day of the month */}
                       {Array.from({ length: 31 }, (_, i) => (
                        <span
                          key={i}
                          className="cursor-pointer rounded-lg px-1 py-1.5 transition hover:bg-surface-overlay"
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "var(--surface-overlay)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          {i + 1}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => alert("Next Day")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border-default bg-card px-3.5 py-2 text-[12px] font-medium text-text-primary transition hover:border-border-accent hover:shadow-sm"
              >
                Next Day
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Metrics Banner */}
            <div className="grid grid-cols-1 divide-y divide-border-subtle sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <MetricCard
                icon={ClipboardList}
                label="Total Evaluations"
                value={totalEvaluations != null ? `${totalEvaluations}` : "--"}
                accentVar="--app-accent"
              />
              <MetricCard
                icon={Trophy}
                label="Daily Team QA Score"
                value={dailyTeamQaScore ?? "--"}
                accentVar="--app-accent"
              />
              <MetricCard
                icon={ShieldAlert}
                label="Failed Evaluations (< 90%)"
                value={failedEvaluations != null ? `${failedEvaluations}` : "--"}
                accentVar="--app-accent"
              />
            </div>
          </section>

          {/* Performance Table */}
          <section className="mt-5 rounded-xl border border-border-subtle bg-surface-raised/50 p-5">
            <h2 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
              <ClipboardList className={`h-4.5 w-4.5 ${a.text}`} />
              Individual Agent Performance Breakdown
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[500px] border-collapse text-left">
                <thead>
                  <tr className={`border-b-2 ${a.border}`}>
                    <th className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                      Agent Name
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                      Average QA Score
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                      Logged Opportunities
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {people.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-8 text-center text-[13px] text-text-muted"
                      >
                        No agents to display.
                      </td>
                    </tr>
                    ) : (
                      people.map((person) => (
                      <tr
                        key={person.name}
                        className="border-b border-border-subtle transition hover:bg-surface-overlay/50"
                      >
                        {/* Render a performance row per agent */}
                        <td className="px-3 py-3 text-[13px] font-medium text-text-primary">
                          {person.name}
                        </td>
                        <td
                          className={`px-3 py-3 text-[13px] font-bold ${a.text}`}
                        >
                          {person.score}
                        </td>
                        <td className="px-3 py-3 text-[13px] text-text-secondary">
                          {person.opportunities}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Roster Panels */}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <RosterPanel
              title="Managed Coach Roster Scope"
              description="Direct alignment mapping metrics (Read-Only access rights enforced)"
              account={unit}
              qaName={qaName}
              people={people}
              showQa
            />
            <RosterPanel
              title="Evaluator Operational Allocations"
              description="Select an agent below to build execution forms or modify history footprints"
              account={unit}
              qaName={qaName}
              people={people}
            />
          </div>
        </section>
      </div>
      <AssignmentModal
        open={assignmentOpen}
        onClose={() => setAssignmentOpen(false)}
        accent={selectedAccent}
        qaList={qaList}
        lobOptions={lobOptions}
        teamLeads={teamLeads}
        initialAgents={agentRows}
      />
    </div>
  );
}

// Compact metric tile used in the timeline banner.
function MetricCard({
  icon: Icon,
  label,
  value,
  accentVar,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: string;
  accentVar: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
        style={{ backgroundColor: `var(${accentVar}-soft)`, color: `var(${accentVar})` }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
          {label}
        </p>
        <p
          className="mt-0.5 text-[28px] font-bold leading-none"
          style={{ color: `var(${accentVar})` }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// Read-only roster panel linking to individual agent detail pages.
function RosterPanel({
  title,
  description,
  account,
  qaName,
  people,
  showQa = false,
}: {
  title: string;
  description: string;
  account: string;
  qaName: string;
  people: AgentPerformance[];
  showQa?: boolean;
}) {
  const a = getAccentColors(useAccent());
  return (
    <section className="rounded-xl border border-border-subtle bg-card p-4">
      <h2 className="flex items-center gap-2 text-[14px] font-bold text-text-primary">
        <UsersRound className={`h-4 w-4 ${a.text}`} />
        {title}
      </h2>
      <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
        {description}
      </p>
      <div className="mt-3 space-y-2">
        {people.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border-subtle bg-surface-raised px-3 py-4 text-center text-[12px] text-text-muted">
            No agents in roster.
          </p>
        ) : (
           people.map((person) => {
             // Build a URL slug from the agent name for the detail link.
             const slug = person.name.toLowerCase().replace(/\s+/g, "-");
            return (
              <Link
                key={person.name}
                href={`/accounts/${account}/roster/${slug}`}
                className={`flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2.5 text-[12px] transition hover:border-current ${a.text}`}
              >
                <span className="font-medium text-text-primary">
                  {person.name}
                </span>
                {showQa && (
                  <span
                    className={`rounded-md ${a.bgLight} px-1.5 py-0.5 text-[10px] font-semibold ${a.text}`}
                  >
                    QA: {qaName}
                  </span>
                )}
                <CircleChevronRight className="ml-auto h-4 w-4 shrink-0 text-text-muted" />
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
