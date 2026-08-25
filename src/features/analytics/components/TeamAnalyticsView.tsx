"use client";

// Team analytics view: trend, volume, defect, and ranking charts for an account.
import { useState } from "react";
import {
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
  Line,
  LineChart,
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
import Breadcrumb from "@/components/shared/Breadcrumb";
import { getAccentColors } from "@/features/accounts/config";
import { useAccent, useAccentHex } from "@/features/settings/useAccent";

// Props for the team analytics view.
type TeamAnalyticsViewProps = {
  account: string;
  qaName: string;
  trendData?: { date: string; value: number }[];
  pieData?: { name: string; value: number; fill: string }[];
  barData?: { defect: string; count: number }[];
  rankingData?: {
    rank: number;
    name: string;
    score: string;
    evaluations: number;
    trend: number[];
  }[];
};

// Selectable trend window options for the analytics filter toolbar.
const timeframes = [
  "Daily",
  "Weekly",
  "Monthly",
  "Quarterly",
  "Yearly",
] as const;

// Renders a medal/rank badge for the performance ranking table.
function RankBadge({ rank, color }: { rank: number; color: string }) {
  const badges: Record<number, string> = {
    1: "\u{1F947}",
    2: "\u{1F948}",
    3: "\u{1F949}",
  };
  // Top three ranks get a medal emoji; others get a numbered circle.
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

// Main team analytics view: header, filter toolbar, and chart/ranking sections.
export default function TeamAnalyticsView({
  account,
  qaName,
  trendData = [],
  pieData = [],
  barData = [],
  rankingData = [],
}: TeamAnalyticsViewProps) {
  // Controls visibility of the calendar date picker popover.
  const [calendarOpen, setCalendarOpen] = useState(false);
  // Tracks the currently selected trend window (Daily/Weekly/...).
  const [activeTimeframe, setActiveTimeframe] = useState<string>("Daily");
  // Normalize account name into a URL-safe slug for the back link.
  const unit = account.toLowerCase();
  // Resolve the active theme accent, its classes, and raw hex value.
  const selectedAccent = useAccent();
  const a = getAccentColors(selectedAccent);
  const accentHex = useAccentHex();

  // Chart metadata: series labels and colors for the trend/area chart.
  const trendChartConfig = {
    value: { label: "QA Score", color: accentHex },
  } satisfies ChartConfig;

  // Chart metadata for the volume allocation pie chart slices.
  const pieChartConfig = {
    "pie-main": { label: "MAIN", color: accentHex },
    "pie-support": { label: "SUPPORT", color: "#6B7280" },
    "pie-escalations": { label: "ESCALATIONS", color: "#EF4444" },
  } satisfies ChartConfig;

  // Chart metadata for the structural defect bar chart.
  const barChartConfig = {
    count: { label: "Defects", color: accentHex },
  } satisfies ChartConfig;

  return (
    <div className="min-h-full bg-surface-base text-text-primary">
      <div className="mx-auto max-w-[1440px] px-6 py-5 md:px-9">
        <Breadcrumb
          backHref={`/accounts/${unit}/dashboard`}
          backLabel="Back to Dashboard"
          segments={[{ label: "Team Performance Analytics" }]}
          accent={selectedAccent}
        />

        {/* Header */}
        <div className="mt-5 mb-6">
          <h1 className="text-[22px] font-bold tracking-tight text-text-primary">
            Team Performance Analytics
          </h1>
          <p className="mt-1 text-[13px]">
            Scope:{" "}
            <span className={`font-semibold ${a.text}`}>{qaName}</span>
            <span className="mx-1.5 text-text-muted">&middot;</span>
            <span className="text-text-secondary">{account}</span>
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
              {/* Render a toggle button per timeframe; selects active window */}
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
                  // Toggle the calendar date picker popover open/closed.
                  onClick={() => setCalendarOpen(!calendarOpen)}
                  className={`flex items-center gap-1.5 rounded-md border ${a.border} bg-card px-3 py-1.5 text-[11px] font-semibold ${a.text} transition hover:bg-surface-elevated`}
                >
                  <CalendarDays size={12} />
                  AUG 15, 2026
                </button>
                {calendarOpen && (
                  <div className="absolute left-1/2 top-full z-50 mt-2 w-[260px] -translate-x-1/2 rounded-xl border border-border-default bg-card p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        onClick={() => setCalendarOpen(false)}
                        className="text-text-muted hover:text-text-primary"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-sm font-semibold text-text-primary">
                        August 2026
                      </span>
                      <ChevronRight
                        size={16}
                        className="text-text-muted"
                      />
                    </div>
                    <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold text-text-muted">
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(
                        (d) => (
                          <div key={d} className="py-1">
                            {d}
                          </div>
                        )
                      )}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
                      {/* Render a clickable day cell for each day of the month */}
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
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.bgLight}`}
                >
                  <TrendingUp size={16} className={a.text} />
                </span>
                <CardTitle className="text-sm font-semibold text-text-primary">
                  QA Accuracy Trend
                </CardTitle>
              </div>
              <div className="rounded-lg bg-surface-raised px-3 py-1.5 text-right">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Avg
                </span>
                 <span
                   className={`block text-sm font-bold ${a.text}`}
                 >
                   {trendData.length > 0
                      ? `${(
                          // Average the trend values for the header summary.
                          trendData.reduce((s, d) => s + d.value, 0) /
                          trendData.length
                        ).toFixed(1)}%`
                     : "--"}
                 </span>
              </div>
            </CardHeader>
            <CardContent>
              {trendData.length === 0 ? (
                <div className="flex h-[220px] w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-subtle bg-surface-raised/50">
                  <p className="text-sm font-semibold text-text-primary">
                    No trend data
                  </p>
                  <p className="text-[12px] text-text-muted">
                    QA accuracy trend will appear here once evaluations are
                    logged.
                  </p>
                </div>
              ) : (
                <ChartContainer
                  config={trendChartConfig}
                  className="h-[220px] w-full"
                >
                  <AreaChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="fillValue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={accentHex}
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor={accentHex}
                          stopOpacity={0.01}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke="#E8E7E5"
                      strokeDasharray="4 3"
                    />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 11, fill: "#8E8F92" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={4}
                      tick={{ fontSize: 10, fill: "#8E8F92" }}
                      domain={["dataMin - 2", "dataMax + 2"]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          indicator="dot"
                          formatter={(value) => [`${value}%`, "QA Score"]}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={accentHex}
                      strokeWidth={2.5}
                      fill="url(#fillValue)"
                      dot={{
                        r: 4,
                        fill: "white",
                        stroke: accentHex,
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 6,
                        fill: "white",
                        stroke: accentHex,
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart - Volume Allocation */}
          <Card className="rounded-2xl border border-border-default bg-card shadow-sm ring-0">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.bgLight}`}
              >
                <PieChartIcon size={16} className={a.text} />
              </span>
              <CardTitle className="text-sm font-semibold text-text-primary">
                Volume Allocation Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <div className="flex h-[220px] w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-subtle bg-surface-raised/50">
                  <p className="text-sm font-semibold text-text-primary">
                    No volume data
                  </p>
                  <p className="text-[12px] text-text-muted">
                    Volume allocation breakdown will appear here once
                    evaluations are logged.
                  </p>
                </div>
              ) : (
                <ChartContainer
                  config={pieChartConfig}
                  className="h-[220px] w-full"
                >
                  <PieChart>
                    <ChartTooltip
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      strokeWidth={2}
                      stroke="#F8F8F6"
                    >
                       {/* Color each pie slice with its configured fill */}
                       {pieData.map((entry, index) => (
                         <Cell
                           key={`cell-${index}`}
                           fill={entry.fill}
                         />
                       ))}
                    </Pie>
                    <Legend
                      content={({ payload }) => (
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                           {/* Render a colored swatch + label per legend entry */}
                           {payload?.map((entry) => (
                            <div
                              key={entry.value}
                              className="flex items-center gap-1.5 text-[11px] text-text-secondary"
                            >
                              <span
                                className="h-2.5 w-2.5 rounded-[2px]"
                                style={{
                                  backgroundColor: entry.color,
                                }}
                              />
                              {entry.value}
                            </div>
                          ))}
                        </div>
                      )}
                    />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bar Chart - Defect Distribution */}
        <Card className="mb-6 rounded-2xl border border-border-default bg-card shadow-sm ring-0">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.bgLight}`}
            >
              <BarChart3 size={16} className={a.text} />
            </span>
            <CardTitle className="text-sm font-semibold text-text-primary">
              Structural Defect Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <div className="flex h-[180px] w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-subtle bg-surface-raised/50">
                <p className="text-sm font-semibold text-text-primary">
                  No defect data
                </p>
                <p className="text-[12px] text-text-muted">
                  Structural defect distribution will appear here once
                  evaluations are logged.
                </p>
              </div>
            ) : (
              <ChartContainer
                config={barChartConfig}
                className="h-[180px] w-full"
              >
                <BarChart
                  data={barData}
                  margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="#E8E7E5"
                    strokeDasharray="4 3"
                  />
                  <XAxis
                    dataKey="defect"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#8E8F92" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#8E8F92" }}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar
                    dataKey="count"
                    fill={accentHex}
                    radius={[4, 4, 0, 0]}
                    barSize={36}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Ranking Table */}
        <Card className="rounded-2xl border border-border-default bg-card shadow-sm ring-0">
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.bgLight}`}
            >
              <Trophy size={16} className={a.text} />
            </span>
            <CardTitle className="text-sm font-semibold text-text-primary">
              Team Performance Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-border-default">
                    <th className="w-16 p-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Rank
                    </th>
                    <th className="p-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Agent Name
                    </th>
                    <th className="p-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Avg Score
                    </th>
                    <th className="p-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Evaluations
                    </th>
                    <th className="hidden w-32 p-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rankingData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center">
                        <p className="text-sm font-semibold text-text-primary">
                          No ranking data
                        </p>
                        <p className="mt-1 text-[12px] text-text-muted">
                          Team performance ranking will appear here once
                          agents are evaluated.
                        </p>
                      </td>
                    </tr>
                    ) : (
                      rankingData.map((row) => (
                      <tr
                        key={row.rank}
                        className="border-b border-border-default transition hover:bg-surface-raised"
                      >
                        {/* Render one table row per ranked agent */}
                        <td className="p-3">
                          <RankBadge rank={row.rank} color={accentHex} />
                        </td>
                        <td className="p-3 text-sm font-medium text-text-primary">
                          {row.name}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-block rounded-md px-2.5 py-1 text-sm font-bold ${a.bgLight} ${a.text}`}
                          >
                            {row.score}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-text-secondary">
                          {row.evaluations}
                        </td>
                        <td className="hidden w-32 p-3">
                          <ChartContainer
                            config={{
                              trend: { label: "Trend", color: accentHex },
                            }}
                            className="h-8 w-full"
                          >
                            <LineChart
                               data={row.trend.map((v, i) => ({
                                 i,
                                 v,
                               }))}
                              margin={{
                                top: 2,
                                right: 2,
                                left: 2,
                                bottom: 2,
                              }}
                            >
                              {/* Convert the trend number array into chart points. */}
                              <Line
                                type="monotone"
                                dataKey="v"
                                stroke={accentHex}
                                strokeWidth={1.5}
                                dot={false}
                              />
                            </LineChart>
                          </ChartContainer>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
