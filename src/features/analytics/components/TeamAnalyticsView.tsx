"use client";

/**
 * Team Analytics View
 * 
 * Renders the Team Performance Analytics page with trend, volume, defect, and 
 * ranking charts. Features real-time updates via Supabase Realtime and client-side
 * filtering (LOB, guideline, timeframe).
 * 
 * Key behaviors:
 * - Anchored to today's date (no date navigation)
 * - Defaults to "Daily" timeframe showing single-day data
 * - Fetches analytics on mount matching default filters to avoid SSR flash
 * - Shows loading state during filter changes
 * - Displays empty states when no data for selected period
 */
import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
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
import { LoadingSpinner } from "@/components/ui/loading";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { getAccentColors } from "@/features/accounts/config";
import { useAccent, useAccentHex } from "@/features/settings/useAccent";
import { createBrowserClient } from "@/lib/supabase/client";

/**
 * Props for the team analytics view.
 * Receives initial data from SSR (server-rendered page) and manages live state.
 */
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

/**
 * Selectable trend window options for the analytics filter toolbar.
 * Timeframes control the date range and bucket grouping for the trend chart.
 */
const timeframes = [
  "Daily",
  "Weekly",
  "Monthly",
  "Quarterly",
  "Yearly",
] as const;

/**
 * Renders a medal/rank badge for the performance ranking table.
 * Top 3 ranks get medal emojis; others get a numbered circle in the accent color.
 */
function RankBadge({ rank, color }: { rank: number; color: string }) {
  const badges: Record<number, string> = {
    1: "\u{1F947}", // Gold medal
    2: "\u{1F948}", // Silver medal
    3: "\u{1F949}", // Bronze medal
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

/**
 * Format a Date object to an ISO date string YYYY-MM-DD.
 * Used for API query parameters.
 */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Friendly empty state shown inside a chart/table when there is no data for the
 * currently selected timeframe and filters.
 */
function NoDataState({ message }: { message?: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-border-subtle bg-surface-raised">
      <p className="px-4 text-center text-[12px] text-text-muted">
        {message ?? "No data available for this period."}
      </p>
    </div>
  );
}

/**
 * Computes the [start, end] date range covered by a selected timeframe.
 * Daily scopes to the single selected day; the longer timeframes expand backward
 * to span multiple calendar periods so the trend chart shows a real trend
 * (e.g. Weekly covers ~8 weeks, Monthly ~6 months, Quarterly ~4 quarters, Yearly ~5
 * years), all ending at the anchor date.
 */
function timeframeRange(tf: string, anchor: Date): { from: Date; to: Date } {
  const start = new Date(anchor);
  const end = new Date(anchor);
  switch (tf) {
    case "Weekly": {
      start.setDate(start.getDate() - 55); // ~8 weeks back
      break;
    }
    case "Monthly": {
      start.setMonth(start.getMonth() - 5, 1); // ~6 months back, aligned to 1st
      break;
    }
    case "Quarterly": {
      start.setMonth(start.getMonth() - 9, 1); // ~4 quarters back, aligned to 1st
      break;
    }
    case "Yearly": {
      start.setFullYear(start.getFullYear() - 4, 0, 1); // ~5 years back, Jan 1
      break;
    }
    default: {
      // Daily: a single day (from == to == anchor).
      break;
    }
  }
  return { from: start, to: end };
}

/**
 * Main team analytics view: header, filter toolbar, and chart/ranking sections.
 * Manages live analytics state, filters, loading states, and Supabase Realtime.
 */
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

  // True while an analytics fetch is in flight, used to show a loader.
  const [loading, setLoading] = useState(false);

  // Anchor date for the analytics period (fixed to the current date on mount,
  // since this view has no date navigation and always runs through today).
  const [selectedDate] = useState(() => new Date());

  // Resolve the active theme accent, its classes, and raw hex value.
  const unit = account.toLowerCase();
  const selectedAccent = useAccent();
  const a = getAccentColors(selectedAccent);
  const accentHex = useAccentHex();

  /**
   * Build the API URL with all current filters.
   * Computes dateFrom/dateTo based on the selected timeframe and anchor date.
   */
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

      // Compute the date range covered by the selected timeframe. Daily uses a
      // single day; the other timeframes expand to their calendar window so the
      // backend can group the trend into multiple periods.
      const { from, to } = timeframeRange(tf, dt);
      params.set("dateFrom", toISODate(from));
      params.set("dateTo", toISODate(to));

      return `/api/analytics?${params.toString()}`;
    },
    [account, activeTimeframe, selectedDate, lobFilter, guidelineFilter]
  );

  /**
   * Fetch analytics data with current filters.
   * Updates all live state atoms on successful response.
   */
  const fetchAnalytics = useCallback(
    async (overrides?: { timeframe?: string; date?: Date; lob?: string; guideline?: string }) => {
      setLoading(true);
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
      } finally {
        setLoading(false);
      }
    },
    [buildApiUrl]
  );

  /**
   * On mount, fetch analytics for the current timeframe and selected date so
   * the charts reflect the active filter instead of the unfiltered server data.
   * Data fetching on mount is intentional despite the strict set-state rule.
   */
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchAnalytics();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  /**
   * Supabase Realtime: listen for changes on rm_qa_evaluations
   * and re-fetch analytics so charts stay live.
   */
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

          </div>
        </div>

        {/* Loading indicator shown only while analytics are refreshed */}
        {loading && (
          <div
            className="mb-3 flex h-8 items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface-raised text-[12px] font-medium text-text-secondary"
            aria-live="polite"
          >
            <LoadingSpinner size="sm" className="border-t-brand-gold" />
            Updating analytics...
          </div>
        )}

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
                <NoDataState message="No QA score data for this period." />
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
                <NoDataState message="No evaluation volume for this period." />
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
                <NoDataState message="No defect data for this period." />
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
                      <td
                        colSpan={5}
                        className="px-3 py-10 text-center text-[12px] text-text-muted"
                      >
                        No ranking data for this period.
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
                  )))}
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
