"use client";

// Team analytics view: trend, volume, defect, and ranking charts for an account.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import Pagination, { paginate } from "@/components/ui/pagination";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { getAccentColors } from "@/features/accounts/config";
import { useAccent, useAccentHex } from "@/features/settings/useAccent";
import { createBrowserClient } from "@/lib/supabase/client";

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
  filterOptions?: { lobOptions: string[]; guidelineOptions: string[] };
};

// Selectable trend window options for the analytics filter toolbar.
const timeframes = [
  "Daily",
  "Weekly",
  "Monthly",
  "Quarterly",
  "Yearly",
] as const;

// Month names for calendar navigation.
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Returns the number of days in a given month/year.
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Returns the day-of-week (0=Sun) for the first day of a month.
function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

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

// Format a Date object to a short display string like "AUG 15, 2026".
function formatDisplayDate(d: Date): string {
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// Format a Date object to an ISO date string YYYY-MM-DD.
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Main team analytics view: header, filter toolbar, and chart/ranking sections.
export default function TeamAnalyticsView({
  account,
  qaName: initialQaName,
  trendData: initialTrendData = [],
  pieData: initialPieData = [],
  barData: initialBarData = [],
  rankingData: initialRankingData = [],
  filterOptions: initialFilterOptions = { lobOptions: [], guidelineOptions: [] },
}: TeamAnalyticsViewProps) {
  // Live analytics state — updated via Supabase Realtime and filter re-fetches.
  const [liveQaName, setLiveQaName] = useState(initialQaName);
  const [liveTrendData, setLiveTrendData] = useState(initialTrendData);
  const [livePieData, setLivePieData] = useState(initialPieData);
  const [liveBarData, setLiveBarData] = useState(initialBarData);
  const [liveRankingData, setLiveRankingData] = useState(initialRankingData);
  const [liveFilterOptions, setLiveFilterOptions] = useState(initialFilterOptions);

  // Ranking pagination state.
  const [rankPage, setRankPage] = useState(1);
  const [rankPageSize, setRankPageSize] = useState(10);

  // Filter state.
  const [lobFilter, setLobFilter] = useState("All LOBs");
  const [guidelineFilter, setGuidelineFilter] = useState("All Guidelines");
  const [activeTimeframe, setActiveTimeframe] = useState<string>("Daily");

  // Date picker state.
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const calRef = useRef<HTMLDivElement>(null);

  // Controls visibility of the calendar date picker popover.
  const unit = account.toLowerCase();
  // Resolve the active theme accent, its classes, and raw hex value.
  const selectedAccent = useAccent();
  const a = getAccentColors(selectedAccent);
  const accentHex = useAccentHex();

  // Build the API URL with all current filters.
  const buildApiUrl = useCallback(
    (overrides?: { timeframe?: string; date?: Date; lob?: string; guideline?: string }) => {
      const tf = overrides?.timeframe ?? activeTimeframe;
      const dt = overrides?.date ?? selectedDate;
      const lob = overrides?.lob ?? lobFilter;
      const guideline = overrides?.guideline ?? guidelineFilter;

      const params = new URLSearchParams({ account: account.toLowerCase() });
      if (tf && tf !== "Daily") params.set("timeframe", tf);
      if (lob && lob !== "All LOBs") params.set("lob", lob);
      if (guideline && guideline !== "All Guidelines") params.set("guideline", guideline);

      // Use the selected date as the date range (single day).
      params.set("dateFrom", toISODate(dt));
      params.set("dateTo", toISODate(dt));

      return `/api/analytics?${params.toString()}`;
    },
    [account, activeTimeframe, selectedDate, lobFilter, guidelineFilter]
  );

  // Fetch analytics data with current filters.
  const fetchAnalytics = useCallback(
    async (overrides?: { timeframe?: string; date?: Date; lob?: string; guideline?: string }) => {
      try {
        const url = buildApiUrl(overrides);
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (data.trendData) setLiveTrendData(data.trendData);
        if (data.pieData) setLivePieData(data.pieData);
        if (data.barData) setLiveBarData(data.barData);
        if (data.rankingData) setLiveRankingData(data.rankingData);
        if (data.qaName) setLiveQaName(data.qaName);
        if (data.filterOptions) setLiveFilterOptions(data.filterOptions);
      } catch (e) {
        console.error("Failed to fetch analytics:", e);
      }
    },
    [buildApiUrl]
  );

  // Supabase Realtime: listen for changes on rm_qa_evaluations
  // and re-fetch analytics so charts stay live.
  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel("analytics-evaluations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rm_qa_evaluations" },
        () => {
          fetchAnalytics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAnalytics]);

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

  // Navigate to previous/next day.
  const navigateDay = useCallback(
    (direction: -1 | 1) => {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + direction);
      setSelectedDate(next);
      fetchAnalytics({ date: next });
    },
    [selectedDate, fetchAnalytics]
  );

  // Select a specific day in the calendar.
  const selectCalendarDay = useCallback((day: number) => {
    const d = new Date(calYear, calMonth, day);
    setSelectedDate(d);
    setCalendarOpen(false);
    fetchAnalytics({ date: d });
  }, [calYear, calMonth, fetchAnalytics]);

  // Calendar grid data.
  const calDays = useMemo(() => {
    const total = daysInMonth(calYear, calMonth);
    const startDay = firstDayOfMonth(calYear, calMonth);
    return { total, startDay };
  }, [calYear, calMonth]);

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
            <span className={`font-semibold ${a.text}`}>{liveQaName}</span>
            <span className="mx-1.5 text-text-muted">&middot;</span>
            <span className="text-text-secondary">{account}</span>
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="mb-8 rounded-2xl border border-border-default bg-card p-3 shadow-sm">
          <div className="flex items-center gap-2">
            {/* LOB Filter */}
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-raised">
                <Layers size={14} className="text-text-muted" />
              </span>
              <select
                value={lobFilter}
                onChange={(e) => {
                  const v = e.target.value;
                  setLobFilter(v);
                  fetchAnalytics({ lob: v });
                }}
                className="min-w-0 flex-1 rounded-lg border border-border-default bg-card px-2.5 py-1.5 text-xs text-text-primary outline-none"
              >
                <option>All LOBs</option>
                {liveFilterOptions.lobOptions.map((lob) => (
                  <option key={lob} value={lob}>{lob}</option>
                ))}
              </select>
            </div>

            {/* Guideline Filter */}
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-raised">
                <Filter size={14} className="text-text-muted" />
              </span>
              <select
                value={guidelineFilter}
                onChange={(e) => {
                  const v = e.target.value;
                  setGuidelineFilter(v);
                  fetchAnalytics({ guideline: v });
                }}
                className="min-w-0 flex-1 rounded-lg border border-border-default bg-card px-2.5 py-1.5 text-xs text-text-primary outline-none"
              >
                <option>All Guidelines</option>
                {liveFilterOptions.guidelineOptions.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="h-6 w-px shrink-0 bg-border-default" />

            {/* Timeframe Toggle */}
            <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border-default bg-surface-raised p-0.5">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    setActiveTimeframe(tf);
                    fetchAnalytics({ timeframe: tf });
                  }}
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

            {/* Date Navigation */}
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => navigateDay(-1)}
                className="flex items-center gap-1 rounded-md border border-border-default bg-card px-2.5 py-1.5 text-[11px] font-medium text-text-secondary transition hover:bg-surface-raised"
              >
                <ChevronLeft size={12} />
                Prev
              </button>
              <div className="relative" ref={calRef}>
                <button
                  onClick={() => setCalendarOpen(!calendarOpen)}
                  className={`flex items-center gap-1.5 rounded-md border ${a.border} bg-card px-3 py-1.5 text-[11px] font-semibold ${a.text} transition hover:bg-surface-elevated`}
                >
                  <CalendarDays size={12} />
                  {formatDisplayDate(selectedDate)}
                </button>
                {calendarOpen && (
                  <div className="absolute left-1/2 top-full z-50 mt-2 w-[260px] -translate-x-1/2 rounded-xl border border-border-default bg-card p-4 shadow-xl">
                    {/* Calendar Header with month navigation */}
                    <div className="mb-3 flex items-center justify-between">
                      <button
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
                        <ChevronLeft size={16} className="text-text-muted" />
                      </button>
                      <span className="text-sm font-semibold text-text-primary">
                        {MONTH_NAMES[calMonth]} {calYear}
                      </span>
                      <button
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
                        <ChevronRight size={16} className="text-text-muted" />
                      </button>
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
                            className={`rounded-lg py-1.5 transition ${
                              isSelected
                                ? `${a.bg} text-white font-semibold`
                                : "text-text-primary hover:bg-surface-raised"
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
                onClick={() => navigateDay(1)}
                className="flex items-center gap-1 rounded-md border border-border-default bg-card px-2.5 py-1.5 text-[11px] font-medium text-text-secondary transition hover:bg-surface-raised"
              >
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
                   {liveTrendData.length > 0
                      ? `${(
                          liveTrendData.reduce((s, d) => s + d.value, 0) /
                    liveTrendData.length
                        ).toFixed(1)}%`
                     : "--"}
                 </span>
              </div>
            </CardHeader>
            <CardContent>
              {liveTrendData.length === 0 ? (
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
                    data={liveTrendData}
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
              {livePieData.length === 0 ? (
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
                      data={livePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      strokeWidth={2}
                      stroke="#F8F8F6"
                    >
                       {livePieData.map((entry, index) => (
                         <Cell
                           key={`cell-${index}`}
                           fill={entry.fill}
                         />
                       ))}
                    </Pie>
                    <Legend
                      content={({ payload }) => (
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
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
            {liveBarData.length === 0 ? (
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
                    data={liveBarData}
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
                  {liveRankingData.length === 0 ? (
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
                      paginate(liveRankingData, rankPage, rankPageSize).map((row) => (
                      <tr
                        key={row.rank}
                        className="border-b border-border-default transition hover:bg-surface-raised"
                      >
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
            {liveRankingData.length > 0 && (
              <Pagination
                currentPage={rankPage}
                pageSize={rankPageSize}
                totalItems={liveRankingData.length}
                onPageChange={setRankPage}
                onPageSizeChange={(size) => {
                  setRankPageSize(size);
                  setRankPage(1);
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
