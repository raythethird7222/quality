"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type RosterCalendarViewProps = {
  account: string;
  personName: string;
  accent: "gold" | "indigo" | "crimson" | "charcoal";
};

const accentColor = {
  gold: { text: "text-brand-indigo", bg: "bg-brand-indigo", border: "border-brand-indigo", hoverBg: "hover:bg-brand-indigo/10", bgLight: "bg-brand-indigo/10", hex: "#2F6798", hoverText: "hover:text-brand-indigo" },
  indigo: { text: "text-brand-indigo", bg: "bg-brand-indigo", border: "border-brand-indigo", hoverBg: "hover:bg-brand-indigo/10", bgLight: "bg-brand-indigo/10", hex: "#2F6798", hoverText: "hover:text-brand-indigo" },
  crimson: { text: "text-brand-indigo", bg: "bg-brand-indigo", border: "border-brand-indigo", hoverBg: "hover:bg-brand-indigo/10", bgLight: "bg-brand-indigo/10", hex: "#2F6798", hoverText: "hover:text-brand-indigo" },
  charcoal: { text: "text-brand-indigo", bg: "bg-brand-indigo", border: "border-brand-indigo", hoverBg: "hover:bg-brand-indigo/10", bgLight: "bg-brand-indigo/10", hex: "#2F6798", hoverText: "hover:text-brand-indigo" },
} as const;

const evaluationDays = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

const evaluationDetails: Record<number, { time: string; type: string; score: string }> = {
  1: { time: "09:00 AM", type: "Call Review", score: "93.2%" },
  2: { time: "10:30 AM", type: "Chat Audit", score: "95.1%" },
  3: { time: "01:00 PM", type: "Call Review", score: "91.8%" },
  4: { time: "09:00 AM", type: "Email Review", score: "96.4%" },
  5: { time: "11:00 AM", type: "Call Review", score: "94.7%" },
  6: { time: "02:00 PM", type: "Chat Audit", score: "92.3%" },
  7: { time: "09:00 AM", type: "Call Review", score: "97.0%" },
  8: { time: "10:30 AM", type: "Email Review", score: "95.5%" },
  9: { time: "01:00 PM", type: "Call Review", score: "93.9%" },
  10: { time: "09:00 AM", type: "Chat Audit", score: "96.2%" },
  11: { time: "11:00 AM", type: "Call Review", score: "94.1%" },
  12: { time: "02:00 PM", type: "Email Review", score: "97.8%" },
  13: { time: "09:00 AM", type: "Call Review", score: "95.0%" },
  14: { time: "10:30 AM", type: "Chat Audit", score: "93.5%" },
  15: { time: "09:00 AM", type: "Call Review", score: "96.7%" },
};

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function RosterCalendarView({ account, personName, accent }: RosterCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(7);
  const [currentYear] = useState(2026);
  const [popupDay, setPopupDay] = useState<number | null>(null);
  const router = useRouter();
  const a = accentColor[accent];

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = 15;

  const displayName = personName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const calendarDays = useMemo(() => {
    const emptyDays: { key: string; empty: true }[] = Array.from({ length: firstDay }, (_, i) => ({ key: `empty-${i}`, empty: true }));
    const realDays = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return {
        key: `day-${day}`,
        day,
        empty: false as const,
        isToday: day === today && currentMonth === 7,
        hasEvaluation: currentMonth === 7 && evaluationDays.includes(day),
        detail: evaluationDetails[day],
      };
    });
    return [...emptyDays, ...realDays];
  }, [firstDay, daysInMonth, currentMonth]);

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <div className="mx-auto max-w-[1440px] px-6 py-5 md:px-9">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-3 text-[13px]" aria-label="Breadcrumb">
          <Link
            href={`/${account}/dashboard`}
            className={`inline-flex items-center gap-2 rounded-lg border ${a.border} bg-card px-3.5 py-2 font-medium ${a.text} transition ${a.hoverBg}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2 text-text-muted">
            <Link href="/" className="transition hover:text-brand-indigo">Home</Link>
            <span>/</span>
            <Link href={`/${account}`} className={`transition ${a.hoverText}`}>{account.toUpperCase()}</Link>
            <span>/</span>
            <span className={`font-semibold ${a.text}`}>{displayName}</span>
          </div>
        </nav>

        {/* Header */}
        <div className="mt-5 mb-6">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.bgLight}`}>
              <CalendarDays size={20} className={a.text} />
            </span>
            <div>
              <h1 className="text-[22px] font-bold tracking-tight text-text-primary">{displayName}</h1>
              <p className="text-[13px] text-text-secondary">Agent Calendar &middot; {account.toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Calendar Card */}
        <div className="overflow-hidden rounded-2xl border border-border-default bg-card shadow-sm">
          {/* Month Header */}
          <div className="flex items-center justify-between border-b border-border-subtle bg-surface-raised/50 px-6 py-4">
            <button
              onClick={() => setCurrentMonth((m) => (m === 0 ? 11 : m - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-default bg-card text-text-muted transition hover:border-border-accent hover:text-text-primary hover:shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold tracking-tight text-text-primary">{months[currentMonth]}</h2>
              <span className="rounded-md bg-surface-overlay px-2 py-0.5 text-[12px] font-semibold text-text-muted">{currentYear}</span>
            </div>
            <button
              onClick={() => setCurrentMonth((m) => (m === 11 ? 0 : m + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-default bg-card text-text-muted transition hover:border-border-accent hover:text-text-primary hover:shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-border-subtle">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
              <div key={d} className={`py-3 text-center text-[11px] font-bold uppercase tracking-wider ${i === 0 || i === 6 ? "text-text-muted/60" : "text-text-muted"}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((cell) => {
              if (cell.empty) {
                return <div key={cell.key} className="min-h-[90px] border-b border-r border-border-subtle/50 bg-surface-base/30" />;
              }

              const { day, isToday, hasEvaluation, detail } = cell as { day: number; isToday: boolean; hasEvaluation: boolean; detail: { time: string; type: string; score: string } | undefined };

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
                  {/* Day Number */}
                  <div className="flex items-start justify-between">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-[12px] font-bold ${
                      isToday
                        ? `${a.bgLight} ${a.text}`
                        : hasEvaluation
                          ? "text-text-primary"
                          : "text-text-muted"
                    }`}>
                      {day}
                    </span>
                    {isToday && (
                      <span className="rounded-full bg-brand-crimson px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Evaluation Info */}
                  {hasEvaluation && detail && (
                    <div className="mt-auto">
                      <span className={`text-[11px] font-bold ${a.text}`}>{detail.score}</span>
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
                <span className={`absolute h-full w-full rounded-full ${a.bgLight}`} />
                <span className={`relative h-1.5 w-1.5 rounded-full ${a.bg}`} />
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setPopupDay(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-[400px] rounded-2xl border border-border-default bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setPopupDay(null)}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg border border-border-default bg-card text-text-muted transition hover:bg-surface-overlay hover:text-text-primary"
            >
              <span className="text-[16px] leading-none">&times;</span>
            </button>

            {/* Title */}
            <div className="border-b border-border-subtle px-6 py-4">
              <h2 className="text-[15px] font-bold text-text-primary">Operational Action Parameter Required</h2>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              {currentMonth === 7 && evaluationDetails[popupDay] ? (
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    Existing Evaluations
                  </p>
                  <div className="rounded-lg border border-border-default bg-surface-raised p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`flex-shrink-0 h-2 w-2 rounded-full ${a.bg}`} />
                        <div className="min-w-0">
                          <div className={`text-[14px] font-bold ${a.text}`}>
                            {evaluationDetails[popupDay].score}
                          </div>
                          <div className="text-[11px] text-text-secondary truncate">
                            {evaluationDetails[popupDay].type} &middot; {evaluationDetails[popupDay].time}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/${account}/roster/${personName}/evaluation/eval-${account}-cxl-${popupDay}-05aug2026-01`)}
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
