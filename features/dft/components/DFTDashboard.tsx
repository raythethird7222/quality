"use client";

import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleChevronRight,
  LineChart,
  List,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";

const agents = [
  { name: "CLAIRA ANN CLAROS", qa: "QA CHERYL", lob: "MAIN" },
  { name: "JIMBOY SARTE", qa: "QA CHERYL", lob: "MAIN" },
  { name: "JOLANE CABUSOG", qa: "QA CHERYL", lob: "MAIN" },
  { name: "MARY GRACE DIOLA", qa: "QA CHERYL", lob: "MAIN" },
];

const evaluators = [
  { name: "CLAIRA ANN CLAROS", lob: "MAIN" },
  { name: "JIMBOY SARTE", lob: "MAIN" },
  { name: "JOLANE CABUSOG", lob: "MAIN" },
  { name: "MARY GRACE DIOLA", lob: "MAIN" },
];

const performanceData = [
  { agent: "CLAIRA ANN CLAROS", avgScore: "94.5%", opportunities: 12 },
  { agent: "JIMBOY SARTE", avgScore: "88.2%", opportunities: 8 },
  { agent: "JOLANE CABUSOG", avgScore: "91.0%", opportunities: 15 },
  { agent: "MARY GRACE DIOLA", avgScore: "96.7%", opportunities: 6 },
];

export default function DFTDashboard() {
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <div className="mx-auto max-w-[1440px]">
        {/* Navigation section */}
        <div className="border-b border-border-default px-6 py-6 md:px-10">
          <Link
            href="/dft"
            className="mb-6 inline-flex items-center gap-2 rounded-lg border border-border-default bg-surface-overlay px-4 py-2 text-sm font-medium text-brand-gold transition hover:border-brand-gold hover:bg-surface-elevated"
          >
            <ArrowLeft size={18} />
            Return back
          </Link>

          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Link href="/" className="hover:text-brand-gold transition">
              Home
            </Link>
            <span>/</span>
            <Link href="/dft" className="hover:text-brand-gold transition">
              DFT
            </Link>
            <span>/</span>
            <span className="text-brand-gold">Dashboard</span>
          </div>
        </div>

        {/* Main content */}
        <main className="px-6 py-10 md:px-10">
          <div className="grid gap-8">
            {/* Account Dashboard Section */}
            <section id="view-account-dashboard" className="rounded-[16px] border border-border-default bg-surface-overlay/60 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              {/* Topbar */}
              <div className="relative flex flex-wrap items-center justify-space-between gap-4">
                <div className="text-center">
                  <h2 id="txt-active-account-title" className="text-xl font-bold text-text-primary">
                    Account Framework View • DFT • QA DIANA
                  </h2>
                </div>

                <div className="absolute right-0 flex flex-wrap items-center gap-3">
                  <Link href="/dft/analytics" className="flex items-center gap-2 rounded-[10px] border border-brand-gold bg-brand-gold px-4 py-2 font-medium text-surface-base transition hover:bg-brand-gold/80">
                    <LineChart size={16} />
                    View Team QA Analytics
                  </Link>

                  <button
                    id="btn-account-settings"
                    className="flex items-center gap-2 rounded-[10px] border border-border-default bg-transparent px-4 py-2 font-medium text-brand-gold transition hover:bg-brand-gold/10"
                    data-tooltip="Manage coach & evaluator assignments"
                    onClick={() => alert("Open Account Assignment Settings")}
                  >
                    <Settings size={16} />
                    QA Assignment
                  </button>
                </div>
              </div>

              {/* Timeline Navigator */}
              <div
                className="mt-6 flex flex-wrap items-center justify-center gap-5 rounded-t-lg border border-border-subtle bg-surface-base/80 p-3"
              >
                <div className="flex items-center gap-4">
                  <button
                    className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-elevated px-4 py-2 text-sm font-medium text-white transition hover:border-brand-gold"
                    onClick={() => alert("Previous Day")}
                  >
                    <ChevronLeft size={14} />
                    Previous Day
                  </button>

                  <div className="relative inline-block">
                    <span
                      id="lbl-summary-active-date"
                      onClick={() => setCalendarOpen(!calendarOpen)}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface-elevated/50 px-[14px] py-[6px] text-center select-none transition duration-200"
                      style={{ minWidth: "140px", color: "#C8A54B", fontWeight: 600, fontSize: "14px", letterSpacing: "0.5px" }}
                    >
                      Aug 15, 2026
                      <CalendarDays size={12} className="text-brand-gold" />
                    </span>

                    {calendarOpen && (
                      <div
                        id="custom-summary-calendar-dropdown"
                        className="absolute left-1/2 top-[calc(100%+8px)] -translate-x-1/2 rounded-xl border border-border-subtle bg-surface-overlay p-4 shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
                        style={{ width: "280px", zIndex: 1000 }}
                      >
                        <div className="mb-3 flex items-center justify-between border-b border-border-subtle pb-2">
                          <ChevronLeft size={14} className="cursor-pointer text-text-muted" onClick={() => alert("Prev Month")} />
                          <span className="font-semibold text-white" style={{ fontSize: "14px" }}>August 2026</span>
                          <ChevronRight size={14} className="cursor-pointer text-text-muted" onClick={() => alert("Next Month")} />
                        </div>
                        <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-semibold text-text-muted">
                          <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-[12px] text-white">
                          {Array.from({ length: 31 }).map((_, i) => (
                            <div key={i} className="rounded-[4px] px-[4px] py-[4px] cursor-pointer transition-colors" onMouseEnter={(e) => e.currentTarget.style.background = "#E0DFDD"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-elevated px-4 py-2 text-sm font-medium text-white transition hover:border-brand-gold"
                    onClick={() => alert("Next Day")}
                  >
                    Next Day
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Yesterday Metrics Banner */}
              <div
                className="mt-0 grid grid-cols-1 gap-px bg-border-subtle sm:grid-cols-3"
                style={{ borderRadius: "0 0 8px 8px", overflow: "hidden", border: "1px solid #D5D4D2" }}
              >
                <div className="bg-surface-overlay p-5 text-left">
                  <span className="block text-[11px] font-semibold leading-none tracking-[1px] text-text-muted uppercase">
                    TOTAL EVALUATIONS
                  </span>
                  <span className="block mt-[5px] text-[32px] font-bold text-brand-gold">
                    1,284
                  </span>
                </div>
                <div className="bg-surface-overlay p-5 text-left">
                  <span className="block text-[11px] font-semibold leading-none tracking-[1px] text-text-muted uppercase">
                    DAILY TEAM QA SCORE
                  </span>
                  <span className="block mt-[5px] text-[32px] font-bold text-brand-gold">
                    92.4%
                  </span>
                </div>
                <div className="bg-surface-overlay p-5 text-left">
                  <span className="block text-[11px] font-semibold leading-none tracking-[1px] text-text-muted uppercase">
                    TOTAL TEAM FAILED EVALUATIONS (&lt;90%)
                  </span>
                  <span className="block mt-[5px] text-[32px] font-bold text-brand-crimson">
                    128
                  </span>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="my-6 rounded-lg border border-border-subtle bg-surface-base/60 p-5">
                <h3 className="mb-4 block text-base tracking-[0.5px] text-text-secondary">
                  <List size={16} className="mr-2 inline-block text-brand-gold" /> Individual Agent Performance Breakdown
                </h3>
                <table className="w-full border-collapse text-left table-fixed">
                  <thead>
                    <tr className="border-b-2 border-border-subtle">
                      <th className="w-[20%] p-[10px] text-left text-[12px] font-semibold text-text-muted">AGENT NAME</th>
                      <th className="w-[40%] p-[10px] text-left text-[12px] font-semibold text-text-muted">AVERAGE QA SCORE</th>
                      <th className="w-[40%] p-[10px] text-left text-[12px] font-semibold text-text-muted">LOGGED OPPORTUNITIES</th>
                    </tr>
                  </thead>
                  <tbody className="opacity-100">
                    {performanceData.map((row, idx) => (
                      <tr key={idx} className="border-b border-border-subtle">
                        <td className="p-[10px] text-[14px] text-white">{row.agent}</td>
                        <td className="p-[10px] text-[14px] text-brand-gold">{row.avgScore}</td>
                        <td className="p-[10px] text-[14px] text-text-secondary">{row.opportunities}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Roster Split Columns */}
              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Managed Coach Roster Scope */}
                <div>
                  <h3 className="mb-[6px] block text-lg leading-[1.4] relative">
                    <Users size={18} className="mr-2 inline-block text-brand-gold" /> Managed Coach Roster Scope
                  </h3>
                  <p className="mb-[15px] block leading-[1.4] relative">
                    Direct alignment mapping metrics (Read-Only access rights enforced)
                  </p>
                  <div className="space-y-2">
                    {agents.map((agent, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-elevated p-3 transition hover:border-brand-gold">
                        <div className="flex items-center gap-3" style={{ width: "100%" }}>
                          <span className="font-medium text-text-primary">{agent.name}</span>
                          <span
                            className="inline-block border bg-brand-gold/10 px-[6px] py-[2px] text-[11px] font-medium leading-none tracking-[0.3px] text-brand-gold rounded-[4px]"
                            style={{ borderColor: "rgba(200, 165, 75, 0.3)" }}
                          >
                            QA: {agent.qa}
                          </span>
                          <span className="ml-auto text-[11px] font-semibold text-text-muted">
                            {agent.lob}
                          </span>
                        </div>
                        <CircleChevronRight size={16} className="text-text-muted" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evaluator Operational Allocations */}
                <div>
                  <h3 className="mb-[6px] block text-lg leading-[1.4] relative">
                    <Users size={18} className="mr-2 inline-block text-brand-gold" /> Evaluator Operational Allocations
                  </h3>
                  <p className="mb-[15px] block leading-[1.4] relative">
                    Select an agent below to build execution forms or modify history footprints
                  </p>
                  <div className="space-y-2">
                    {evaluators.map((agent, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-elevated p-3 transition hover:border-brand-gold">
                        <div className="flex items-center gap-3" style={{ width: "100%" }}>
                          <span className="font-medium text-text-primary">{agent.name}</span>
                          <span className="ml-auto text-[11px] font-semibold text-text-muted">
                            {agent.lob}
                          </span>
                        </div>
                        <CircleChevronRight size={16} className="text-text-muted" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}