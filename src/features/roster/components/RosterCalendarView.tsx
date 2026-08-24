"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { getAccentColors } from "@/features/accounts/config";
import { slugToDisplayName } from "@/lib/utils";
import type { Accent, EvaluationDay } from "@/types";

type RosterCalendarViewProps = {
  account: string;
  personName: string;
  accent: Accent;
};

const evaluationDays: number[] = [];
const evaluationDetails: Record<number, EvaluationDay> = {};

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

export default function RosterCalendarView({
  account,
  personName,
  accent,
}: RosterCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(7);
  const [currentYear] = useState(2026);
  const [popupDay, setPopupDay] = useState<number | null>(null);
  const router = useRouter();
  const a = getAccentColors(accent);

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = 15;

  const displayName = slugToDisplayName(personName);

  const calendarDays = useMemo(() => {
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
        isToday: day === today && currentMonth === 7,
        hasEvaluation:
          currentMonth === 7 && evaluationDays.includes(day),
        detail: evaluationDetails[day],
      };
    });
    return [...emptyDays, ...realDays];
  }, [firstDay, daysInMonth, currentMonth]);

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
          accent={accent}
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
        <div className="overflow-hidden rounded-2xl border border-border-default bg-card shadow-sm">
          {/* Month Header */}
          <div className="flex items-center justify-between border-b border-border-subtle bg-surface-raised/50 px-6 py-4">
            <button
              onClick={() =>
                setCurrentMonth((m) => (m === 0 ? 11 : m - 1))
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-default bg-card text-text-muted transition hover:border-border-accent hover:text-text-primary hover:shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold tracking-tight text-text-primary">
                {months[currentMonth]}
              </h2>
              <span className="rounded-md bg-surface-overlay px-2 py-0.5 text-[12px] font-semibold text-text-muted">
                {currentYear}
              </span>
            </div>
            <button
              onClick={() =>
                setCurrentMonth((m) => (m === 11 ? 0 : m + 1))
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-default bg-card text-text-muted transition hover:border-border-accent hover:text-text-primary hover:shadow-sm"
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
                isToday,
                hasEvaluation,
                detail,
              } = cell as {
                day: number;
                isToday: boolean;
                hasEvaluation: boolean;
                detail: EvaluationDay | undefined;
              };

              return (
                <button
                  key={cell.key}
                  onClick={() => setPopupDay(day)}
                  className={`group relative flex min-h-[90px] flex-col border-b border-r border-border-subtle/50 p-2.5 transition-all duration-150 ${
                    isToday
                      ? `border-2 ${a.border} bg-card`
                      : hasEvaluation
                        ? "bg-card hover:shadow-md hover:z-10"
                        : "bg-card hover:bg-surface-overlay/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-[12px] font-bold ${
                        isToday
                          ? `${a.bgLight} ${a.text}`
                          : hasEvaluation
                            ? "text-text-primary"
                            : "text-text-muted"
                      }`}
                    >
                      {day}
                    </span>
                    {isToday && (
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
            className="relative w-full max-w-[400px] rounded-2xl border border-border-default bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPopupDay(null)}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg border border-border-default bg-card text-text-muted transition hover:bg-surface-overlay hover:text-text-primary"
            >
              <span className="text-[16px] leading-none">&times;</span>
            </button>

            <div className="border-b border-border-subtle px-6 py-4">
              <h2 className="text-[15px] font-bold text-text-primary">
                Operational Action Parameter Required
              </h2>
            </div>

            <div className="px-6 py-5">
              {currentMonth === 7 && evaluationDetails[popupDay] ? (
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    Existing Evaluations
                  </p>
                  <div className="rounded-lg border border-border-default bg-surface-raised p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex-shrink-0 h-2 w-2 rounded-full ${a.bg}`}
                        />
                        <div className="min-w-0">
                          <div
                            className={`text-[14px] font-bold ${a.text}`}
                          >
                            {evaluationDetails[popupDay].score}
                          </div>
                          <div className="truncate text-[11px] text-text-secondary">
                            {evaluationDetails[popupDay].type} &middot;{" "}
                            {evaluationDetails[popupDay].time}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          router.push(
                            `/accounts/${account}/roster/${personName}/evaluation/eval-${account}-cxl-${popupDay}-05aug2026-01`
                          )
                        }
                        className={`flex-shrink-0 rounded-lg border ${a.border} bg-card px-3 py-1.5 text-[11px] font-semibold ${a.text} transition ${a.hoverBg}`}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-[13px] text-text-muted">
                  No evaluations found for this date.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
