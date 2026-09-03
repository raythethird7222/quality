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
import Breadcrumb from "@/components/shared/Breadcrumb";
import Pagination, { paginate } from "@/components/ui/pagination";
import { LoadingSpinner } from "@/components/ui/loading";
import { getAccentColors } from "@/features/accounts/config";
import { useAccent } from "@/features/settings/useAccent";
import { debounce } from "@/lib/debounce";
import type { AgentPerformance } from "@/types";
import type { AccountEvaluationRow } from "@/lib/db/quality";

// Props for the account framework dashboard view.
type AccountFrameworkViewProps = {
  account: string;
  qaName: string;
  people: AgentPerformance[];
  totalEvaluations?: number;
  dailyTeamQaScore?: string;
  failedEvaluations?: number;
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
  agentRows,
}: AccountFrameworkViewProps) {
  // Controls visibility of the timeline date picker popover.
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Date navigation state.
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const calRef = useRef<HTMLDivElement>(null);
  // Monotonic counter so only the most recent day-filter request updates state.
  // Prevents an out-of-order (stale) response from overwriting newer data.
  const fetchSeq = useRef(0);

  // Live data state — updated when date changes. Always scoped to the selected
  // date (populated on mount and whenever the day changes). The full roster is
  // retained when a selected day has no evaluations yet.
  const [livePeople, setLivePeople] = useState<AgentPerformance[]>(initialPeople);
  const [liveTotal, setLiveTotal] = useState<number | undefined>(undefined);
  const [liveScore, setLiveScore] = useState<string | undefined>(undefined);
  const [liveFailed, setLiveFailed] = useState<number | undefined>(undefined);

  // True from the start: the metrics/table are always scoped to the currently
  // selected day (the calendar defaults to today). The table therefore shows
  // only the records for that specific selected date.
  const [dayFilterActive, setDayFilterActive] = useState(true);

// True while a day-filter request is in flight, used to show a loader.
  const [loading, setLoading] = useState(false);

// Month-evaluation modal: visibility and the list of evaluations for the
// selected month. Populated when the user clicks "Evaluate" in the calendar.
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [evalMonthData, setEvalMonthData] = useState<AccountEvaluationRow[]>([]);
  const [evalMonthLoading, setEvalMonthLoading] = useState(false);

// Performance table pagination state.
  const [perfPage, setPerfPage] = useState(1);
  const [perfPageSize, setPerfPageSize] = useState(10);

  const evaluatorPeople = useMemo(
    () =>
      initialPeople.filter((person) =>
        agentRows.some((row) => row.name === person.name && row.evaluator === qaName),
      ),
    [initialPeople, agentRows, qaName],
  );

  const coachPeople = useMemo(
    () =>
      initialPeople.filter((person) =>
        agentRows.some((row) => row.name === person.name && row.coach === qaName),
      ),
    [initialPeople, agentRows, qaName],
  );

  // Normalize account name into a URL-safe slug for navigation links.
  const unit = account.toLowerCase();
  // Resolve the active theme accent and its mapped color classes.
  const selectedAccent = useAccent();
  const a = getAccentColors(selectedAccent);

  // Fetch analytics for the selected date.
  const fetchForDate = useCallback(
    async (date: Date) => {
      const seq = ++fetchSeq.current;
      setLoading(true);
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
        // Ignore stale responses from a previous, slower request.
        if (seq !== fetchSeq.current) return;
        // Reflect the fetched day, including an empty result so a day with no
        // evaluations correctly shows "No data".
        const performanceByName = new Map<string, AgentPerformance>(
          (data.agentPerformance ?? []).map((person: AgentPerformance) => [person.name, person])
        );
        setLivePeople(
          initialPeople.map((person) => performanceByName.get(person.name) ?? person)
        );
        if (data.totalEvaluations != null) setLiveTotal(data.totalEvaluations);
        if (data.avgScore != null) setLiveScore(`${data.avgScore.toFixed(1)}%`);
        else setLiveScore("--");
        if (data.failedEvaluations != null)
          setLiveFailed(data.failedEvaluations);
      } catch (e) {
        console.error("Failed to fetch dashboard analytics:", e);
      } finally {
        if (seq === fetchSeq.current) {
          setLoading(false);
        }
      }
    },
    [initialPeople, unit]
  );

  // Fetch evaluations for the selected month and open the modal.
  const openEvaluateModal = useCallback(async () => {
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const from = toISODate(monthStart);
    const to = toISODate(monthEnd);
    setEvalMonthLoading(true);
    setEvalModalOpen(true);
    try {
      const params = new URLSearchParams({ account: unit, dateFrom: from, dateTo: to });
      const res = await fetch(`/api/evaluations?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      setEvalMonthData(data.evaluations ?? []);
    } catch (e) {
      console.error("Failed to fetch month evaluations:", e);
    } finally {
      setEvalMonthLoading(false);
    }
  }, [selectedDate, unit]);

  // Navigate to previous/next day.
  const navigateDay = useCallback(
    (direction: -1 | 1) => {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + direction);
      setSelectedDate(next);
      setDayFilterActive(true);
      fetchForDate(next);
    },
    [selectedDate, fetchForDate]
  );

  // Select a specific day in the calendar.
  const selectCalendarDay = useCallback((day: number) => {
    const d = new Date(calYear, calMonth, day);
    setSelectedDate(d);
    setCalendarOpen(false);
    setDayFilterActive(true);
    fetchForDate(d);
  }, [calYear, calMonth, fetchForDate]);

  // Supabase Realtime: when evaluations change, re-fetch the currently selected
  // day so the day filter and metrics stay live without a manual refresh.
  // Refs hold the latest values so the once-subscribed channel always reads the
  // most recent state. They are updated in effects (not during render).
  const selectedDateRef = useRef(selectedDate);
  const dayFilterActiveRef = useRef(dayFilterActive);
  const fetchRef = useRef(fetchForDate);

  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);
  useEffect(() => {
    dayFilterActiveRef.current = dayFilterActive;
  }, [dayFilterActive]);
  useEffect(() => {
    fetchRef.current = fetchForDate;
  }, [fetchForDate]);

  useEffect(() => {
    let disposed = false;
    let teardown: (() => void) | undefined;

    void (async () => {
      const { createBrowserClient } = await import("@/lib/supabase/client");
      if (disposed) return;
      const supabase = createBrowserClient();
      // Coalesce bursts of realtime events into a single refetch.
      const refetch = debounce(() => {
        if (dayFilterActiveRef.current) {
          fetchRef.current(new Date(selectedDateRef.current));
        }
      }, 300);

      const channel = supabase
        .channel("account-dashboard-evaluations")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "evaluations" },
          refetch
        )
        .subscribe();

      teardown = () => {
        supabase.removeChannel(channel);
      };
    })();

    return () => {
      disposed = true;
      teardown?.();
    };
  }, []);

  // On mount, fetch the initially selected date (today) so the performance table
  // shows only that specific day's records, matching the selected-date semantics.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchForDate(new Date(selectedDateRef.current));
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

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
              <Link
                href={`/accounts/${unit}/assignments`}
                className={`inline-flex items-center gap-2 rounded-lg border ${a.border} bg-card px-5 py-2.5 text-[13px] font-semibold ${a.text} transition ${a.hoverBg}`}
              >
                <Settings className="h-4 w-4" />
                QA Assignment
              </Link>
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
                  <div className={`absolute left-1/2 z-20 mt-2 w-[260px] -translate-x-1/2 rounded-xl border ${a.border} bg-card p-4 shadow-xl`}>
                    <div className={`mb-3 flex items-center justify-between text-sm font-semibold ${a.text}`}>
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
                        className={`rounded p-1 transition ${a.hoverBg}`}
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
                        className={`rounded p-1 transition ${a.hoverBg}`}
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
                                : `${a.hoverBg}`
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

            {/* Loading indicator — fixed height so it never shifts the layout */}
            <div
              className="flex h-9 items-center justify-center gap-2 border-t border-border-subtle bg-surface-raised px-4 text-[12px] font-medium text-text-secondary"
              aria-live="polite"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="border-t-brand-gold" />
                  Loading {formatDisplayDate(selectedDate)} data...
                </>
              ) : (
                <span className="invisible">Loading&hellip;</span>
              )}
            </div>

            {/* Month evaluations modal */}
            {evalModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="relative bg-card rounded-2xl p-6 w-full max-w-2xl">
                  {/* Modal header */}
                  <div className="flex justify-between items-start pb-4">
                    <h2 className="text-[18px] font-bold text-text-primary">
                      Evaluations for {new Date(selectedDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </h2>
                    <button
                      onClick={() => setEvalModalOpen(false)}
                      className="rounded-md p-2 hover:bg-surface-raised"
                    >
                      <CircleChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Modal content */}
                  <div className="space-y-4">
                    {evalMonthLoading ? (
                      <div className="flex h-[200px] items-center justify-center">
                        <p className="text-text-secondary">Loading evaluations...</p>
                      </div>
                    ) : evalMonthData.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-text-secondary">No evaluations found for this month.</p>
                      </div>
                    ) : (
                      <div className="overflow-y-auto h-[400px]">
                        <table className="w-full border-collapse text-left">
                          <thead>
                            <tr className="border-b-2 border-border-default">
                              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                                Date
                              </th>
                              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                                Agent
                              </th>
                              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                                Evaluator
                              </th>
                              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                                Guideline
                              </th>
                              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                                Score
                              </th>
                              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                                Ticket/Bill
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {evalMonthData.map((evaluation) => (
                              <tr key={evaluation.evaluationId} className="border-b border-border-default hover:bg-surface-raised">
                                <td className="px-3 py-2 text-sm text-text-secondary">
                                  {evaluation.evaluationDate ? new Date(evaluation.evaluationDate).toLocaleDateString() : '--'}
                                </td>
                                <td className="px-3 py-2 text-sm font-medium text-text-primary">
                                  {evaluation.agentName}
                                </td>
                                <td className="px-3 py-2 text-sm text-text-secondary">
                                  {evaluation.evaluatorName}
                                </td>
                                <td className="px-3 py-2 text-sm text-text-secondary">
                                  {evaluation.guideline || '--'}
                                </td>
                                <td className="px-3 py-2">
                                  {evaluation.qaScore !== null ? (
                                    <span className={`inline-block rounded-md px-2.5 py-1 text-sm font-bold ${
                                      evaluation.qaScore! >= 90
                                        ? `${getAccentColors(useAccent()).bgLight} ${getAccentColors(useAccent()).text}`
                                        : 'bg-surface-raised text-text-muted'
                                    }`}>
                                      {evaluation.qaScore}%
                                    </span>
                                  ) : (
                                    <span className="text-text-secondary">--</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-sm text-text-secondary">
                                  {evaluation.ticketBill || '--'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Modal footer */}
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => setEvalModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-raised"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Metrics Banner */}

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
              people={coachPeople}
              agentRows={agentRows}
              showQa
              showEval={false}
              scope="coach"
            />
            <RosterPanel
              title="Evaluator Operational Allocations"
              description="Select an agent below to build execution forms or modify history footprints"
              account={unit}
              qaName={qaName}
              people={evaluatorPeople}
              agentRows={agentRows}
              scope="evaluator"
            />
          </div>
        </section>
      </div>
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
  showEval = true,
  scope = "evaluator",
}: {
  title: string;
  description: string;
  account: string;
  qaName: string;
  people: AgentPerformance[];
  agentRows: AccountFrameworkViewProps["agentRows"];
  showQa?: boolean;
  showEval?: boolean;
  scope?: "coach" | "evaluator";
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
                href={`/accounts/${account}/roster/${slug}?scope=${scope}`}
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
                {showEval && row?.evaluator && (
                  <span className="rounded-md bg-surface-overlay px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary">
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
