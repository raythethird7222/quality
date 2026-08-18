"use client";

import { ArrowLeft, Calendar, CalendarDays, ChevronLeft, ChevronRight, Filter, Layers, Trophy } from "lucide-react";
import Link from "next/link";

const linePoints = [
  { x: 151.66666666666669, y: 40, label: "AUG 9", value: "100.00%" },
  { x: 233.33333333333334, y: 40, label: "AUG 10", value: "100.00%" },
  { x: 315, y: 40, label: "AUG 11", value: "100.00%" },
  { x: 396.6666666666667, y: 40, label: "AUG 12", value: "100.00%" },
  { x: 478.33333333333337, y: 40, label: "AUG 13", value: "100.00%" },
  { x: 560, y: 40, label: "AUG 14", value: "100.00%" },
];

export default function JSAnalytics() {
  const d = linePoints;
  const pathD = `M ${d[0].x} ${d[0].y} L ${d[1].x} ${d[1].y} L ${d[2].x} ${d[2].y} L ${d[3].x} ${d[3].y} L ${d[4].x} ${d[4].y} L ${d[5].x} ${d[5].y}`;
  const circles = d.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#2F6798"></circle>`).join("");
  const labels = d.map((p) => `<text x="${p.x}" y="28" fill="#1C1D20" textAnchor="middle" style="font-size: 9px; font-weight: 600;">${p.value}</text>`).join("");

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <div className="mx-auto max-w-[1440px]">
        <section id="view-analytics-dashboard" className="p-6 md:p-10">
          <div className="mb-6">
            <Link href="/js/dashboard" className="mb-4 inline-flex items-center gap-2 rounded-lg border border-border-default bg-surface-overlay px-4 py-2 text-sm font-medium text-brand-indigo transition hover:border-brand-indigo hover:bg-surface-elevated">
              <ArrowLeft size={18} />
              Return back
            </Link>
            <h2 id="txt-analytics-title" className="text-xl font-bold text-text-primary">Team Performance Analytics</h2>
            <p id="txt-analytics-subtitle" className="mt-1 text-sm text-brand-indigo">Scope: QA CHERYL (JS)</p>
          </div>

          <div className="analytics-filter-toolbar mb-6 flex flex-wrap items-center gap-4">
              <div className="analytics-filter-group flex items-center gap-2">
                <label className="analytics-filter-label"><Layers size={16} className="text-text-muted" /></label>
                <select id="analytics-lob-filter" className="analytics-filter-select rounded-lg border border-border-default bg-surface-overlay px-3 py-2 text-sm text-text-primary">
                  <option value="ALL">All LOBs</option>
                  <option value="MAIN">MAIN</option>
                </select>
              </div>
              <div className="analytics-filter-group flex items-center gap-2">
                <label className="analytics-filter-label"><Filter size={16} className="text-text-muted" /></label>
                <select id="analytics-guideline-filter" className="analytics-filter-select rounded-lg border border-border-default bg-surface-overlay px-3 py-2 text-sm text-text-primary">
                  <option value="ALL">All Guidelines</option>
                  <option value="MAIN">MAIN</option>
                </select>
              </div>
              <div className="analytics-filter-group flex items-center gap-2">
                <label className="analytics-filter-label"><CalendarDays size={16} className="text-text-muted" /></label>
                <div className="timeframe-toggle-buttons flex items-center gap-1">
                  <button id="btn-tf-daily" className="btn btn-secondary btn-sm active border border-border-default bg-brand-indigo/10 px-3 py-2 text-xs font-medium text-brand-indigo">Daily</button>
                  <button id="btn-tf-weekly" className="btn btn-secondary btn-sm border border-border-default bg-surface-overlay px-3 py-2 text-xs font-medium text-brand-indigo">Weekly</button>
                  <button id="btn-tf-monthly" className="btn btn-secondary btn-sm border border-border-default bg-surface-overlay px-3 py-2 text-xs font-medium text-brand-indigo">Monthly</button>
                  <button id="btn-tf-quarterly" className="btn btn-secondary btn-sm border border-border-default bg-surface-overlay px-3 py-2 text-xs font-medium text-brand-indigo">Quarterly</button>
                  <button id="btn-tf-yearly" className="btn btn-secondary btn-sm border border-border-default bg-surface-overlay px-3 py-2 text-xs font-medium text-brand-indigo">Yearly</button>
                </div>
              </div>
              <div className="analytics-filter-group flex items-center gap-2">
                <label className="analytics-filter-label"><Calendar size={16} className="text-text-muted" /></label>
                <div className="navigation-arrow-buttons flex items-center gap-2">
                  <button className="btn btn-secondary btn-sm border border-border-default bg-surface-overlay px-3 py-2 text-xs font-medium text-brand-indigo"><ChevronLeft size={12} /> Prev</button>
                  <button id="btn-tf-current-label" className="btn btn-dark-accent btn-sm disabled border border-border-default bg-surface-overlay px-3 py-2 text-xs font-medium text-text-muted">AUG 15, 2026</button>
                   <button className="btn btn-secondary btn-sm border border-border-default bg-surface-overlay px-3 py-2 text-xs font-medium text-brand-indigo">Next <ChevronRight size={12} /></button>
                </div>
              </div>
            </div>

          <div className="analytics-charts-grid grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="chart-card rounded-[16px] border border-border-default bg-surface-overlay p-5">
              <div className="chart-card-header mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-text-primary">QA Accuracy Evaluation Trend (Line Graph)</h3>
                <div id="quarterly-average-container" className="analytics-summary-kpi hidden rounded-lg bg-surface-elevated px-3 py-1 text-right">
                  <span className="analytics-summary-label block text-[10px] uppercase text-text-muted">Year Avg</span>
                  <span id="linegraph-quarter-average" className="analytics-summary-value block text-sm font-bold text-brand-indigo">94.50%</span>
                </div>
              </div>
              <div className="chart-container-surface">
                <svg id="svg-trend-line-chart" viewBox="0 0 600 240" className="native-svg-chart-surface h-full w-full">
                  <g>
                    <line x1="40" y1="40" x2="580" y2="40" stroke="#D5D4D2" strokeDasharray="4,4" />
                    <text x="10" y="44" fill="#8E8F92" style={{ fontSize: "10px" }}>100%</text>
                    <line x1="40" y1="120" x2="580" y2="120" stroke="#D5D4D2" strokeDasharray="4,4" />
                    <text x="10" y="124" fill="#8E8F92" style={{ fontSize: "10px" }}>95%</text>
                    <line x1="40" y1="200" x2="580" y2="200" stroke="#D5D4D2" strokeDasharray="4,4" />
                    <text x="10" y="204" fill="#8E8F92" style={{ fontSize: "10px" }}>90%</text>
                    <text x="70" y="230" fill="#6B6C70" textAnchor="middle" style={{ fontSize: "9px", fontWeight: 500 }}>AUG 9</text>
                    <text x="151.66666666666669" y="230" fill="#6B6C70" textAnchor="middle" style={{ fontSize: "9px", fontWeight: 500 }}>AUG 10</text>
                    <text x="233.33333333333334" y="230" fill="#6B6C70" textAnchor="middle" style={{ fontSize: "9px", fontWeight: 500 }}>AUG 11</text>
                    <text x="315" y="230" fill="#6B6C70" textAnchor="middle" style={{ fontSize: "9px", fontWeight: 500 }}>AUG 12</text>
                    <text x="396.6666666666667" y="230" fill="#6B6C70" textAnchor="middle" style={{ fontSize: "9px", fontWeight: 500 }}>AUG 13</text>
                    <text x="478.33333333333337" y="230" fill="#6B6C70" textAnchor="middle" style={{ fontSize: "9px", fontWeight: 500 }}>AUG 14</text>
                    <text x="560" y="230" fill="#6B6C70" textAnchor="middle" style={{ fontSize: "9px", fontWeight: 500 }}>AUG 15</text>
                  </g>
                  <path d={pathD} fill="none" stroke="#2F6798" strokeWidth="3" />
                  <g>
                    {circles}
                    {labels}
                  </g>
                </svg>
              </div>
            </div>
            <div className="chart-card rounded-[16px] border border-border-default bg-surface-overlay p-5">
              <h3 className="mb-4 text-base font-semibold text-text-primary">Volume Allocations Breakdown (Pie Graph)</h3>
              <div className="chart-container-surface">
                <svg id="svg-pie-distribution-chart" viewBox="0 0 300 240" className="native-svg-chart-surface h-full w-full">
                  <text x="150" y="120" fill="#8E8F92" textAnchor="middle">No Opportunities Logged for Period</text>
                </svg>
                <div id="pie-chart-legend-box" className="custom-chart-legend"></div>
              </div>
            </div>
          </div>

          <div className="analytics-charts-grid secondary-grid mt-6">
            <div className="chart-card full-width rounded-[16px] border border-border-default bg-surface-overlay p-5">
              <h3 className="mb-4 text-base font-semibold text-text-primary">Structural Defect Critical Path Distribution (Bar Graph Attribute Weightings)</h3>
              <div className="chart-container-surface large-scale">
                <div id="custom-bar-chart-surface" className="native-bar-chart-wrapper">
                  <p className="empty-state-notice text-sm text-text-muted">No process performance structural defect parameters elements logged within current active view timeframe.</p>
                </div>
              </div>
            </div>
          </div>

          <div id="analytics-ranking-table-card" className="chart-card full-width mt-6 rounded-[16px] border border-border-default bg-surface-overlay p-5">
            <h3 className="mb-4 text-base font-semibold text-text-primary">Quarterly / Monthly Team Performance Ranking Index</h3>
            <div className="table-scroll-surface overflow-x-auto">
              <table className="ranking-data-table w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-xs font-semibold uppercase text-text-muted">Rank Position</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase text-text-muted">Agent Practitioner Name</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase text-text-muted">Average Realized Score Metric</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase text-text-muted">Evaluations Conducted Count</th>
                  </tr>
                </thead>
                <tbody id="ranking-table-body-rows">
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "#8E8F92" }}>No available agent performance tracking allocations logged inside timeframe guidelines.</td>
                  </tr>
                </tbody>
              </table>
                </div>
              </div>
            </section>
          </div>
        </div>
  );
}
