"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  PieChart as PieChartIcon,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const trendData = [
  { date: "AUG 9", value: 93.1 },
  { date: "AUG 10", value: 95.4 },
  { date: "AUG 11", value: 92.8 },
  { date: "AUG 12", value: 96.0 },
  { date: "AUG 13", value: 94.2 },
  { date: "AUG 14", value: 95.7 },
];

const pieData = [
  { name: "MAIN", value: 480, fill: "var(--color-pie-main)" },
  { name: "SUPPORT", value: 290, fill: "var(--color-pie-support)" },
  { name: "ESCALATIONS", value: 210, fill: "var(--color-pie-escalations)" },
];

const barData = [
  { defect: "Opening", count: 32 },
  { defect: "Empathy", count: 28 },
  { defect: "Compliance", count: 22 },
  { defect: "Accuracy", count: 15 },
  { defect: "Closing", count: 10 },
];

const rankingData = [
  { rank: 1, name: "JIMBOY SARTE", score: "95.2%", evaluations: 20 },
  { rank: 2, name: "CLAIRA ANN CLAROS", score: "93.8%", evaluations: 18 },
  { rank: 3, name: "JOLANE CABUSOG", score: "91.5%", evaluations: 22 },
  { rank: 4, name: "MARY GRACE DIOLA", score: "89.3%", evaluations: 15 },
];

const timeframes = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"] as const;

const a = { text: "text-brand-charcoal", bg: "bg-brand-charcoal", border: "border-brand-charcoal", bgLight: "bg-brand-charcoal/10", hoverBg: "hover:bg-brand-charcoal/10", hex: "#363435" };

function RankBadge({ rank, color }: { rank: number; color: string }) {
  const badges: Record<number, string> = { 1: "\u{1F947}", 2: "\u{1F948}", 3: "\u{1F949}" };
  if (rank <= 3) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface-elevated text-sm">
        {badges[rank]}
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {rank}
    </span>
  );
}

export default function BFManagerAnalytics() {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState<string>("Daily");

  const trendChartConfig = {
    value: { label: "QA Score", color: a.hex },
  } satisfies ChartConfig;

  const pieChartConfig = {
    "pie-main": { label: "MAIN", color: "#2F6798" },
    "pie-support": { label: "SUPPORT", color: "#C8A54B" },
    "pie-escalations": { label: "ESCALATIONS", color: "#ED1C25" },
  } satisfies ChartConfig;

  const barChartConfig = {
    count: { label: "Defects", color: a.hex },
  } satisfies ChartConfig;

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <div className="mx-auto max-w-[1440px] px-6 py-5 md:px-9">
        <nav className="flex flex-wrap items-center gap-3 text-[13px]" aria-label="Breadcrumb">
          <Link
            href="/bf"
            className={`inline-flex items-center gap-2 rounded-lg border ${a.border} bg-card px-3.5 py-2 font-medium ${a.text} transition ${a.hoverBg}`}
          >
            <ArrowLeft size={16} />
            Back to Manager Dashboard
          </Link>
          <div className="flex items-center gap-2 text-text-muted">
            <Link href="/" className="transition hover:text-brand-indigo">Home</Link>
            <span>/</span>
            <span className={`font-semibold ${a.text}`}>Manager Analytics</span>
          </div>
        </nav>

        <div className="mt-5 mb-6">
          <h1 className="text-[22px] font-bold tracking-tight text-text-primary">Manager Performance Analytics</h1>
          <p className="mt-1 text-[13px]">
            Scope: <span className={`font-semibold ${a.text}`}>QA BRIAN</span>
            <span className="mx-1.5 text-text-muted">&middot;</span>
            <span className="text-text-secondary">BF</span>
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="mb-8 rounded-2xl border border-border-default bg-card p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-raised">
                <Layers size={14} className="text-text-muted" />
              </span>
              <select className="min-w-0 flex-1 rounded-lg border border-border-default bg-card px-2.5 py-1.5 text-xs text-text-primary outline-none">
                <option>All LOBs</option>
                <option>MAIN</option>
              </select>
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-raised">
                <Filter size={14} className="text-text-muted" />
              </span>
              <select className="min-w-0 flex-1 rounded-lg border border-border-default bg-card px-2.5 py-1.5 text-xs text-text-primary outline-none">
                <option>All Guidelines</option>
                <option>MAIN</option>
              </select>
            </div>

            <div className="h-6 w-px shrink-0 bg-border-default" />

            <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border-default bg-surface-raised p-0.5">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setActiveTimeframe(tf)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition whitespace-nowrap ${
                    activeTimeframe === tf
                      ? `${a.bgLight} ${a.text}`
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <div className="h-6 w-px shrink-0 bg-border-default" />

            <div className="flex shrink-0 items-center gap-1.5">
              <button className="flex items-center gap-1 rounded-md border border-border-default bg-card px-2.5 py-1.5 text-[11px] font-medium text-text-secondary transition hover:bg-surface-raised">
                <ChevronLeft size={12} />
                Prev
              </button>
              <div className="relative">
                <button
                  onClick={() => setCalendarOpen(!calendarOpen)}
                  className={`flex items-center gap-1.5 rounded-md border ${a.border} bg-card px-3 py-1.5 text-[11px] font-semibold ${a.text} transition hover:bg-surface-elevated`}
                >
                  <CalendarDays size={12} />
                  AUG 15, 2026
                </button>
                {calendarOpen && (
                  <div className="absolute left-1/2 top-full z-50 mt-2 w-[260px] -translate-x-1/2 rounded-xl border border-border-default bg-card p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                      <button onClick={() => setCalendarOpen(false)} className="text-text-muted hover:text-text-primary">
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-sm font-semibold text-text-primary">August 2026</span>
                      <ChevronRight size={16} className="text-text-muted" />
                    </div>
                    <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold text-text-muted">
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                        <div key={d} className="py-1">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
                      {Array.from({ length: 31 }).map((_, i) => (
                        <button
                          key={i}
                          className={`rounded-lg py-1.5 transition ${
                            i + 1 === 15
                              ? `${a.bg} text-white font-semibold`
                              : "text-text-primary hover:bg-surface-raised"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button className="flex items-center gap-1 rounded-md border border-border-default bg-card px-2.5 py-1.5 text-[11px] font-medium text-text-secondary transition hover:bg-surface-raised">
                Next
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Line Chart - QA Accuracy Trend */}
          <Card className="rounded-2xl border border-border-default bg-card shadow-sm ring-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.bgLight}`}>
                  <TrendingUp size={16} className={a.text} />
                </span>
                <CardTitle className="text-sm font-semibold text-text-primary">QA Accuracy Trend</CardTitle>
              </div>
              <div className="rounded-lg bg-surface-raised px-3 py-1.5 text-right">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-text-muted">Avg</span>
                <span className={`block text-sm font-bold ${a.text}`}>94.5%</span>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={trendChartConfig} className="h-[220px] w-full">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bfFillValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={a.hex} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={a.hex} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#E8E7E5" strokeDasharray="4 3" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11, fill: "#8E8F92" }} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={4} tick={{ fontSize: 10, fill: "#8E8F92" }} domain={["dataMin - 2", "dataMax + 2"]} tickFormatter={(v) => `${v}%`} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" formatter={(value) => [`${value}%`, "QA Score"]} />} />
                  <Area type="monotone" dataKey="value" stroke={a.hex} strokeWidth={2.5} fill="url(#bfFillValue)" dot={{ r: 4, fill: "white", stroke: a.hex, strokeWidth: 2 }} activeDot={{ r: 6, fill: "white", stroke: a.hex, strokeWidth: 2 }} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Pie Chart - Volume Allocation */}
          <Card className="rounded-2xl border border-border-default bg-card shadow-sm ring-0">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.bgLight}`}>
                <PieChartIcon size={16} className={a.text} />
              </span>
              <CardTitle className="text-sm font-semibold text-text-primary">Volume Allocation Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={pieChartConfig} className="h-[220px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} strokeWidth={2} stroke="#F8F8F6">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend content={({ payload }) => (
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      {payload?.map((entry) => (
                        <div key={entry.value} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                          <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: entry.color }} />
                          {entry.value}
                        </div>
                      ))}
                    </div>
                  )} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bar Chart - Defect Distribution */}
        <Card className="mb-6 rounded-2xl border border-border-default bg-card shadow-sm ring-0">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.bgLight}`}>
              <BarChart3 size={16} className={a.text} />
            </span>
            <CardTitle className="text-sm font-semibold text-text-primary">Structural Defect Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barChartConfig} className="h-[180px] w-full">
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E8E7E5" strokeDasharray="4 3" />
                <XAxis dataKey="defect" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8E8F92" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#8E8F92" }} />
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="count" fill={a.hex} radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Ranking Table */}
        <Card className="rounded-2xl border border-border-default bg-card shadow-sm ring-0">
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.bgLight}`}>
              <Trophy size={16} className={a.text} />
            </span>
            <CardTitle className="text-sm font-semibold text-text-primary">Team Performance Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-border-default">
                    <th className="w-16 p-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Rank</th>
                    <th className="p-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Agent Name</th>
                    <th className="p-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Avg Score</th>
                    <th className="p-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Evaluations</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingData.map((row) => (
                    <tr key={row.rank} className="border-b border-border-default transition hover:bg-surface-raised">
                      <td className="p-3">
                        <RankBadge rank={row.rank} color={a.hex} />
                      </td>
                      <td className="p-3 text-sm font-medium text-text-primary">{row.name}</td>
                      <td className="p-3">
                        <span className={`inline-block rounded-md px-2.5 py-1 text-sm font-bold ${a.bgLight} ${a.text}`}>
                          {row.score}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-text-secondary">{row.evaluations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
