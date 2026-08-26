"use client";

// Account framework view: ops dashboard with metrics, performance, and rosters.
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import Pagination, { paginate } from "@/components/ui/pagination";
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

// Month names for calendar.
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Short month names for display.
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Returns the number of days in a given month/year.
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Returns the day-of-week (0=Sun) for the first day of a month.
function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// Format a Date object to a short display string like "Aug 15, 2026".
function formatDisplayDate(d: Date): string {
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// Format a Date object to an ISO date string YYYY-MM-DD.
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Main account framework view: header, timeline, metrics, and roster panels.
export default function AccountFrameworkView({
  account,
  qaName,
  people: initialPeople,
  totalEvaluations: initialTotal,
  dailyTeamQaScore: initialScore,
  failedEvaluations: initialFailed,
  qaList,
  lobOptions,
  teamLeads,
  agentRows,
}: AccountFrameworkViewProps) {
  // Controls visibility of the timeline date picker popover.
  const [calendarOpen, setCalendarOpen] = useState(false);
  // Controls visibility of the QA assignment modal.
  const [assignmentOpen, setAssignmentOpen] = useState(false);

  // Date navigation state.
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const calRef = useRef<HTMLDivElement>(null);

  // Live data state — updated when date changes.
  const [livePeople, setLivePeople] = useState(initialPeople);
  const [liveTotal, setLiveTotal] = useState(initialTotal);
  const [liveScore, setLiveScore] = useState(initialScore);
  const [liveFailed, setLiveFailed] = useState(initialFailed);

  // Performance table pagination state.
  const [perfPage, setPerfPage] = useState(1);
  const [perfPageSize, setPerfPageSize] = useState(10);

  // Normalize account name into a URL-safe slug for navigation links.
  const unit = account.toLowerCase();
  // Resolve the active theme accent and its mapped color classes.
  const selectedAccent = useAccent();
  const a = getAccentColors(selectedAccent);

  // Fetch analytics for the selected date.
  const fetchForDate = useCallback(
    async (date: Date) => {
      try {
        const iso = toISODate(date);
        const params = new URLSearchParams({
          account: unit,
          dateFrom: iso,
          dateTo: iso,
        });
        const res = await fetch(`/api/analytics?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.totalEvaluations != null) setLiveTotal(data.totalEvaluations);
        if (data.avgScore != null) setLiveScore(`${data.avgScore.toFixed(1)}%`);
        else setLiveScore("--");
        if (data.failedEvaluations != null) setLiveFailed(data.failedEvaluations);
        if (data.agentPerformance) setLivePeople(data.agentPerformance);
      } catch (e) {
        console.error("Failed to fetch dashboard analytics:", e);
      }
    },
    [unit]
  );

  // Navigate to previous/next day.
  const navigateDay = useCallback(
    (direction: -1 | 1) => {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + direction);
      setSelectedDate(next);
      fetchForDate(next);
    },
    [selectedDate, fetchForDate]
  );

  // Select a specific day in the calendar.
  const selectCalendarDay = useCallback((day: number) => {
    const d = new Date(calYear, calMonth, day);
    setSelectedDate(d);
    setCalendarOpen(false);
    fetchForDate(d);
  }, [calYear, calMonth, fetchForDate]);

  // Close calendar when clicking outside.
  useEffect(() => {
    if (!calendarOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calendarOpen]);

  // Calendar grid data.
  const calDays = useMemo(() => {
    const total = daysInMonth(calYear, calMonth);
    const startDay = firstDayOfMonth(calYear, calMonth);
    return { total, startDay };
  }, [calYear, calMonth]);

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
                onClick={() => navigateDay(-1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border-default bg-card px-3.5 py-2 text-[12px] font-medium text-text-primary transition hover:border-border-accent hover:shadow-sm"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous Day
              </button>

              <div className="relative" ref={calRef}>
                <button
                  type="button"
                  onClick={() => setCalendarOpen((o) => !o)}
                  className={`inline-flex items-center gap-2 rounded-lg border ${a.border} bg-card px-4 py-2 text-[13px] font-bold ${a.text} transition hover:shadow-sm`}
                >
                  {formatDisplayDate(selectedDate)}
                  <CalendarDays className="h-3.5 w-3.5" />
                </button>

                {calendarOpen && (
                  <div className="absolute left-1/2 z-20 mt-2 w-[260px] -translate-x-1/2 rounded-xl border border-border-default bg-card p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between text-sm font-semibold text-text-primary">
                      <button
                        type="button"
                        onClick={() => {
                          if (calMonth === 0) {
                            setCalMonth(11);
                            setCalYear((y) => y - 1);
                          } else {
                            setCalMonth((m) => m - 1);
                          }
                        }}
                        className="rounded p-1 transition hover:bg-surface-overlay"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {MONTH_NAMES[calMonth]} {calYear}
                      <button
                        type="button"
                        onClick={() => {
                          if (calMonth === 11) {
                            setCalMonth(0);
                            setCalYear((y) => y + 1);
                          } else {
                            setCalMonth((m) => m + 1);
                          }
                        }}
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
                      {/* Empty cells for days before the 1st */}
                      {Array.from({ length: calDays.startDay }).map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}
                      {/* Render a clickable day cell for each day of the month */}
                      {Array.from({ length: calDays.total }).map((_, i) => {
                        const day = i + 1;
                        const isSelected =
                          selectedDate.getDate() === day &&
                          selectedDate.getMonth() === calMonth &&
                          selectedDate.getFullYear() === calYear;
                        return (
                          <button
                            key={day}
                            onClick={() => selectCalendarDay(day)}
                            className={`cursor-pointer rounded-lg px-1 py-1.5 transition ${
                              isSelected
                                ? `${a.bg} text-app-accent-contrast font-semibold`
                                : "hover:bg-surface-overlay"
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigateDay(1)}
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
                value={liveTotal != null ? `${liveTotal}` : "--"}
                accentVar="--app-accent"
              />
              <MetricCard
                icon={Trophy}
                label="Daily Team QA Score"
                value={liveScore ?? "--"}
                accentVar="--app-accent"
              />
              <MetricCard
                icon={ShieldAlert}
                label="Failed Evaluations (< 90%)"
                value={liveFailed != null ? `${liveFailed}` : "--"}
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
                  {livePeople.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-8 text-center text-[13px] text-text-muted"
                      >
                        No agents to display.
                      </td>
                    </tr>
                    ) : (
                      paginate(livePeople, perfPage, perfPageSize).map((person) => {
                      return (
                      <tr
                        key={person.name}
                        className="border-b border-border-subtle transition hover:bg-surface-overlay/50"
                      >
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
                    );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {livePeople.length > 0 && (
              <Pagination
                currentPage={perfPage}
                pageSize={perfPageSize}
                totalItems={livePeople.length}
                onPageChange={setPerfPage}
                onPageSizeChange={(size) => {
                  setPerfPageSize(size);
                  setPerfPage(1);
                }}
              />
            )}
          </section>

          {/* Roster Panels */}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <RosterPanel
              title="Managed Coach Roster Scope"
              description="Direct alignment mapping metrics (Read-Only access rights enforced)"
              account={unit}
              qaName={qaName}
              people={livePeople}
              agentRows={agentRows}
              showQa
            />
            <RosterPanel
              title="Evaluator Operational Allocations"
              description="Select an agent below to build execution forms or modify history footprints"
              account={unit}
              qaName={qaName}
              people={livePeople}
              agentRows={agentRows}
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
  agentRows,
  showQa = false,
}: {
  title: string;
  description: string;
  account: string;
  qaName: string;
  people: AgentPerformance[];
  agentRows: AccountFrameworkViewProps["agentRows"];
  showQa?: boolean;
}) {
  const a = getAccentColors(useAccent());
  // Build a lookup of evaluator data keyed by agent name.
  const evalByName = new Map(
    agentRows.map((r) => [r.name, r])
  );

  const [rosterPage, setRosterPage] = useState(1);
  const [rosterPageSize, setRosterPageSize] = useState(10);

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
           paginate(people, rosterPage, rosterPageSize).map((person) => {
             const slug = person.name.toLowerCase().replace(/\s+/g, "-");
             const row = evalByName.get(person.name);
            return (
              <Link
                key={person.name}
                href={`/accounts/${account}/roster/${slug}`}
                className={`flex items-center gap-2 rounded-lg border ${a.border} ${a.bgLight} px-3 py-2.5 text-[12px] transition hover:shadow-sm ${a.text}`}
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
                {row?.evaluator && (
                  <span className={`rounded-md ${a.bgLight} px-1.5 py-0.5 text-[10px] font-semibold ${a.text}`}>
                    Eval: {row.evaluator}
                  </span>
                )}
                <CircleChevronRight className="ml-auto h-4 w-4 shrink-0 text-text-muted" />
              </Link>
            );
          })
        )}
      </div>
      {people.length > 0 && (
        <Pagination
          currentPage={rosterPage}
          pageSize={rosterPageSize}
          totalItems={people.length}
          onPageChange={setRosterPage}
          onPageSizeChange={(size) => {
            setRosterPageSize(size);
            setRosterPage(1);
          }}
        />
      )}
    </section>
  );
}
