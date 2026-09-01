"use client";

// Roster calendar view: agent monthly calendar with evaluation days and popup.
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { getAccentColors } from "@/features/accounts/config";
import { useAccent } from "@/features/settings/useAccent";
import { slugToDisplayName } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase/client";
import type { EvaluationDay } from "@/types";
import type { AgentEvaluation } from "@/lib/db/quality";

// Props for the roster calendar view.
type RosterCalendarViewProps = {
  account: string;
  personName: string;
  evaluations: AgentEvaluation[];
  canEvaluate: boolean;
};

// Month name labels used in the calendar header.
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Main roster calendar view: header, month grid, legend, and day popup.
export default function RosterCalendarView({
  account,
  personName,
  evaluations: initialEvaluations,
  canEvaluate,
}: RosterCalendarViewProps) {
  // Index of the displayed month (0=Jan ... 11=Dec); starts on current month.
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  // Year shown by the calendar.
  const [currentYear] = useState(() => new Date().getFullYear());
  // Day number for the open detail popup, or null when closed.
  const [popupDay, setPopupDay] = useState<number | null>(null);
  // Live evaluations state — updated via Supabase Realtime.
  const [evaluations, setEvaluations] =
    useState<AgentEvaluation[]>(initialEvaluations);
  const router = useRouter();
  const selectedAccent = useAccent();
  const a = getAccentColors(selectedAccent);

  // Supabase Realtime: listen for INSERT/UPDATE/DELETE on rm_qa_evaluations
  // so the calendar updates instantly when new evaluations come in.
  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel("roster-evaluations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rm_qa_evaluations" },
        () => {
          // Re-fetch the full evaluation list for this agent on any change.
          fetch(`/api/evaluations?account=${account}&agent=${personName}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.evaluations) setEvaluations(data.evaluations);
            })
            .catch(console.error);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [account, personName]);

  // Today's date for highlighting.
  const todayDate = new Date();
  const todayDay = todayDate.getDate();
  const todayMonth = todayDate.getMonth();
  const todayYear = todayDate.getFullYear();

  const displayName = slugToDisplayName(personName);

  // Build lookup maps from evaluation data for the current month.
  const { evaluationDays, evaluationDetails } = useMemo(() => {
    const days = new Set<number>();
    const details: Record<
      number,
      { evaluations: EvaluationDay[]; score: string }
    > = {};

    for (const ev of evaluations) {
      if (!ev.evaluation_date) continue;
      const parts = ev.evaluation_date.split("-");
      if (parts.length < 3) continue;
      const evYear = parseInt(parts[0], 10);
      const evMonth = parseInt(parts[1], 10) - 1;
      const evDay = parseInt(parts[2], 10);

      if (evYear !== currentYear || evMonth !== currentMonth) continue;

      days.add(evDay);

      if (!details[evDay]) {
        details[evDay] = { evaluations: [], score: "" };
      }
      details[evDay].evaluations.push({
        time: ev.evaluation_date,
        type: ev.guideline ?? "Evaluation",
        score: ev.qa_score != null ? `${ev.qa_score}%` : "--",
      });
      // Show the latest score for the day badge.
      if (ev.qa_score != null) {
        details[evDay].score = `${ev.qa_score}%`;
      }
    }

    return { evaluationDays: days, evaluationDetails: details };
  }, [evaluations, currentMonth, currentYear]);

  // Memoized grid of calendar cells (empty padding + real days) for the month.
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const emptyDays: { key: string; empty: true }[] = Array.from(
      { length: firstDay },
      (_, i) => ({ key: `empty-${i}`, empty: true })
    );
    const realDays = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return {
        key: `day-${day}`,
        day,
        empty: false as const,
        today: day === todayDay && currentMonth === todayMonth && currentYear === todayYear,
        hasEvaluation: evaluationDays.has(day),
        detail: evaluationDetails[day],
      };
    });
    return [...emptyDays, ...realDays];
  }, [currentMonth, currentYear, evaluationDays, evaluationDetails, todayDay, todayMonth, todayYear]);

  return (
    <div className="min-h-full bg-surface-base text-text-primary">
      <div className="mx-auto max-w-[1440px] px-6 py-5 md:px-9">
        <Breadcrumb
          backHref={`/accounts/${account}/dashboard`}
          backLabel="Back to Dashboard"
          segments={[
            { label: account.toUpperCase(), href: `/accounts/${account}` },
            { label: displayName },
          ]}
          accent={selectedAccent}
        />

        {/* Header */}
        <div className="mt-5 mb-6">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.bgLight}`}
            >
              <CalendarDays size={20} className={a.text} />
            </span>
            <div>
              <h1 className="text-[22px] font-bold tracking-tight text-text-primary">
                {displayName}
              </h1>
              <p className="text-[13px] text-text-secondary">
                Agent Calendar &middot; {account.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Calendar Card */}
        <div className={`overflow-hidden rounded-2xl border ${a.border} bg-card shadow-sm`}>
          {/* Month Header */}
          <div className={`flex items-center justify-between border-b border-border-subtle bg-surface-raised/50 px-6 py-4`}>
            <button
              onClick={() =>
                setCurrentMonth((m) => (m === 0 ? 11 : m - 1))
              }
              className={`flex h-9 w-9 items-center justify-center rounded-lg border ${a.border} bg-card text-text-muted transition ${a.hoverBg} hover:text-text-primary hover:shadow-sm`}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold tracking-tight text-text-primary">
                {months[currentMonth]}
              </h2>
              <span className={`rounded-md ${a.bgLight} px-2 py-0.5 text-[12px] font-semibold ${a.text}`}>
                {currentYear}
              </span>
            </div>
            <button
              onClick={() =>
                setCurrentMonth((m) => (m === 11 ? 0 : m + 1))
              }
              className={`flex h-9 w-9 items-center justify-center rounded-lg border ${a.border} bg-card text-text-muted transition ${a.hoverBg} hover:text-text-primary hover:shadow-sm`}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-border-subtle">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (d, i) => (
                <div
                  key={d}
                  className={`py-3 text-center text-[11px] font-bold uppercase tracking-wider ${
                    i === 0 || i === 6
                      ? "text-text-muted/60"
                      : "text-text-muted"
                  }`}
                >
                  {d}
                </div>
              )
            )}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((cell) => {
              if (cell.empty) {
                return (
                  <div
                    key={cell.key}
                    className="min-h-[90px] border-b border-r border-border-subtle/50 bg-surface-base/30"
                  />
                );
              }

              const {
                day,
                today: cellToday,
                hasEvaluation,
                detail,
              } = cell as {
                day: number;
                today: boolean;
                hasEvaluation: boolean;
                detail:
                  | { evaluations: EvaluationDay[]; score: string }
                  | undefined;
              };

              return (
                <button
                  key={cell.key}
                  onClick={() => setPopupDay(day)}
                  className={`group relative flex min-h-[90px] flex-col border-b border-r border-border-subtle/50 p-2.5 transition-all duration-150 ${
                    cellToday
                      ? `border-2 ${a.border} bg-card`
                      : hasEvaluation
                        ? "bg-card hover:shadow-md hover:z-10"
                        : `bg-card ${a.hoverBg}`
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-[12px] font-bold ${
                        cellToday
                          ? `${a.bgLight} ${a.text}`
                          : hasEvaluation
                            ? "text-text-primary"
                            : "text-text-muted"
                      }`}
                    >
                      {day}
                    </span>
                    {cellToday && (
                      <span className="rounded-full bg-brand-crimson px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                        Today
                      </span>
                    )}
                  </div>

                  {hasEvaluation && detail && (
                    <div className="mt-auto">
                      <span
                        className={`text-[11px] font-bold ${a.text}`}
                      >
                        {detail.score}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 border-t border-border-subtle bg-surface-raised/30 px-6 py-3">
            <span className="flex items-center gap-2 text-[11px] text-text-muted">
              <span className="relative flex h-3 w-3 items-center justify-center">
                <span
                  className={`absolute h-full w-full rounded-full ${a.bgLight}`}
                />
                <span
                  className={`relative h-1.5 w-1.5 rounded-full ${a.bg}`}
                />
              </span>
              Evaluation Day
            </span>
            <span className="flex items-center gap-2 text-[11px] text-text-muted">
              <span className="relative flex h-3 w-3 items-center justify-center">
                <span className="absolute h-full w-full rounded-full bg-brand-crimson/10" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-brand-crimson" />
              </span>
              Today
            </span>
            <span className="flex items-center gap-2 text-[11px] text-text-muted">
              <span className="h-2.5 w-2.5 rounded border border-border-default bg-card" />
              No Evaluation
            </span>
          </div>
        </div>
      </div>

      {/* Popup overlay */}
      {popupDay !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={() => setPopupDay(null)}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className={`relative w-full max-w-[400px] rounded-2xl border ${a.border} bg-card shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPopupDay(null)}
              className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg border ${a.border} bg-card text-text-muted transition ${a.hoverBg} hover:text-text-primary`}
            >
              <span className="text-[16px] leading-none">&times;</span>
            </button>

            <div className="border-b border-border-subtle px-6 py-4">
              <h2 className="text-[15px] font-bold text-text-primary">
                Evaluations for {months[currentMonth]} {popupDay}
              </h2>
            </div>

            <div className="px-6 py-5">
              {evaluationDetails[popupDay] ? (
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    Existing Evaluations ({evaluationDetails[popupDay].evaluations.length})
                  </p>
                  <div className="max-h-[300px] space-y-2 overflow-y-auto">
                    {evaluationDetails[popupDay].evaluations.map(
                      (ev, i) => (
                        <div
                          key={i}
                          className={`rounded-lg border ${a.border} bg-surface-raised p-3`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <span
                                className={`flex-shrink-0 h-2 w-2 rounded-full ${a.bg}`}
                              />
                              <div className="min-w-0">
                                <div
                                  className={`text-[14px] font-bold ${a.text}`}
                                >
                                  {ev.score}
                                </div>
                                <div className="truncate text-[11px] text-text-secondary">
                                  {ev.type}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                router.push(
                                  `/accounts/${account}/roster/${personName}/evaluation/eval-${account}-${popupDay}-${i}`
                                )
                              }
                              className={`flex-shrink-0 rounded-lg border ${a.border} bg-card px-3 py-1.5 text-[11px] font-semibold ${a.text} transition ${a.hoverBg}`}
                            >
                              View
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-[13px] text-text-muted">
                  No evaluations found for this date.
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-border-subtle">
                {canEvaluate ? (
                  <button
                    onClick={() => router.push(`/accounts/${account}/roster/${personName}/evaluation/new?day=${popupDay}&month=${currentMonth}&year=${currentYear}`)}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-lg ${a.bg} px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-90`}
                  >
                    <Plus className="h-4 w-4" />
                    Evaluate
                  </button>
                ) : (
                  <p className="text-center text-[12px] text-text-muted">
                    Read-Only Access — You are not the assigned Evaluator
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
