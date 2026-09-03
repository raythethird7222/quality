"use client";

// Operator dashboard: summary stats and analytics charts.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ShieldCheck,
  TrendingUp,
  Trophy,
  UsersRound,
  UserX,
  AlertTriangle,
  ArrowUp,
  Building2,
  ChevronRight,
  ChartPie,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useAccent, useAccentHex } from "@/features/settings/useAccent";
import { getAccentColors } from "@/features/accounts/config";
import { debounce } from "@/lib/debounce";
import type { AuthUser } from "@/types";
import type { DashboardOverview } from "@/lib/db/employees";
import type { DashboardTimeframe } from "@/lib/db/quality";

// Main operator dashboard: profile card, stats, and analytics sections.
export default function Dashboard({
  user,
  overview,
}: {
  user: AuthUser;
  overview: DashboardOverview;
}) {
  // Live overview state — updated via Supabase Realtime.
  const [liveOverview, setLiveOverview] =
    useState<DashboardOverview>(overview);
  const [timeframe, setTimeframe] = useState<DashboardTimeframe>("Daily");
  const [pendingTimeframe, setPendingTimeframe] =
    useState<DashboardTimeframe | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const pendingTimeframeRef = useRef<DashboardTimeframe | null>(null);

  const fetchOverview = useCallback(
    async (requestedTimeframe: DashboardTimeframe, showProgress = true) => {
      if (!showProgress && pendingTimeframeRef.current) return false;
      const requestId = ++requestIdRef.current;
      const today = new Date();
      const localDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
      ].join("-");

      if (showProgress) {
        pendingTimeframeRef.current = requestedTimeframe;
        setPendingTimeframe(requestedTimeframe);
        setFilterError(null);
      }

      try {
        const params = new URLSearchParams({
          timeframe: requestedTimeframe,
          date: localDate,
        });
        const response = await fetch(`/api/dashboard?${params.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Unable to load filtered dashboard data");

        const data = (await response.json()) as { overview?: DashboardOverview };
        if (!data.overview) throw new Error("Dashboard response is incomplete");
        if (requestId !== requestIdRef.current) return false;

        setLiveOverview(data.overview);
        return true;
      } catch (error) {
        if (requestId === requestIdRef.current) {
          setFilterError(
            error instanceof Error ? error.message : "Unable to load dashboard data"
          );
        }
        return false;
      } finally {
        if (showProgress) {
          pendingTimeframeRef.current = null;
          setPendingTimeframe((current) =>
            current === requestedTimeframe ? null : current
          );
        }
      }
    },
    []
  );

  // Supabase Realtime: listen for changes on evaluations
  // and re-fetch the dashboard overview so charts stay live. The client is
  // lazy-loaded so the ~230KB supabase-js chunk is not parsed on the
  // initial render of this page.
  useEffect(() => {
    let disposed = false;
    let teardown: (() => void) | undefined;

    void (async () => {
      const { createBrowserClient } = await import("@/lib/supabase/client");
      if (disposed) return;
      const supabase = createBrowserClient();
      // Coalesce bursts of realtime events into a single refetch.
      const refetch = debounce(() => {
        void fetchOverview(timeframe, false);
      }, 300);

      const channel = supabase
        .channel("dashboard-evaluations")
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
  }, [fetchOverview, timeframe]);

  // Reconcile server-rendered data with the browser's local calendar date.
  useEffect(() => {
    const refreshTimer = window.setTimeout(() => {
      void fetchOverview("Daily", false);
    }, 0);
    return () => window.clearTimeout(refreshTimer);
  }, [fetchOverview]);

  const handleTimeframeChange = async (requestedTimeframe: DashboardTimeframe) => {
    if (requestedTimeframe === timeframe || pendingTimeframe) return;
    const loaded = await fetchOverview(requestedTimeframe);
    if (loaded) setTimeframe(requestedTimeframe);
  };

  // Display name falls back to "Operator" when no employee name is set.
  const name = user?.employee_name ?? "Operator";

  // Resolve the active theme accent, raw hex, and mapped color classes.
  const selectedAccent = useAccent();
  const accentHex = useAccentHex();
  const a = getAccentColors(selectedAccent);
  // Switch the welcome copy based on whether the user is a manager.
  const useManagerDashboard = liveOverview.isManager;

  const formatDateLabel = (dateKey: string): string => {
    const date = new Date(`${dateKey}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateKey;
    return new Intl.DateTimeFormat("en", {
      weekday: timeframe === "Weekly" ? "short" : undefined,
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const filteredTrendData = liveOverview.charts.trendData.map((point) => ({
    date: point.date,
    label: formatDateLabel(point.date),
    value: point.score,
  }));

  const filteredAvgScore = liveOverview.charts.avgScore;

  const defectTotal = liveOverview.charts.barData.reduce(
    (total, item) => total + item.count,
    0
  );
  const defectColors = [accentHex, "#E0A11A", "#7555BE", "#E5484D"];

  // Summary stat tiles: account/agent/QA counts pulled from the overview.
  const stats = [
    {
      label: "Total Accounts",
      value: liveOverview.accounts.length,
      detail: `${liveOverview.accounts.length} active accounts`,
      icon: Building2,
      iconClassName: "bg-[#1D4F91] text-white",
      detailClassName: "text-blue-700 dark:text-blue-300",
    },
    {
      label: "Total Active Agents",
      value: liveOverview.totalActiveAgents,
      detail: "Active agents",
      icon: UsersRound,
      iconClassName: "bg-[#1D4F91] text-white",
      detailClassName: "text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "Inactive Agents",
      value: liveOverview.totalInactiveAgents,
      detail: `${liveOverview.totalAgents > 0 ? ((liveOverview.totalInactiveAgents / liveOverview.totalAgents) * 100).toFixed(1) : "0.0"}% of total agents`,
      icon: UserX,
      iconClassName: "bg-[#D99A0B] text-white",
      detailClassName: "text-amber-700 dark:text-amber-300",
    },
    {
      label: "QA Evaluators",
      value: liveOverview.totalQAs,
      detail: `${liveOverview.totalQAs} active`,
      icon: ShieldCheck,
      iconClassName: "bg-[#1D4F91] text-white",
      detailClassName: "text-emerald-700 dark:text-emerald-300",
    },
  ];

  const trendConfig = {
    value: { label: "QA Score", color: accentHex },
  } satisfies ChartConfig;

  const defectConfig = {
    count: { label: "Count", color: accentHex },
  } satisfies ChartConfig;

  return (
    <main className="mb-10 min-h-full overflow-x-hidden bg-surface-base text-text-primary">
      <header className="relative flex min-h-52 items-start justify-between gap-4 overflow-hidden px-4 sm:min-h-56 sm:px-6 md:h-60 md:px-9">
        {/* eslint-disable-next-line @next/next/no-img-element -- Decorative Supabase Storage hero art */}
        <img
          className="pointer-events-none absolute inset-y-0 right-0 h-full w-[92%] object-contain object-right dark:hidden"
          src="https://zhdmsmwrskxowvytedgh.supabase.co/storage/v1/object/public/Images/ligh_mode_hero.png"
          alt=""
          aria-hidden="true"
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- Decorative Supabase Storage hero art */}
        <img
          className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[92%] object-contain object-right dark:block"
          src="https://zhdmsmwrskxowvytedgh.supabase.co/storage/v1/object/public/Images/dark_mode_hero.png"
          alt=""
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-0 top-0 h-full w-48 opacity-80 sm:w-64 md:w-80"
          aria-hidden="true"
        >
          <div className="absolute left-0 top-0 h-full w-full bg-[linear-gradient(135deg,rgba(30,64,175,0.34),rgba(14,165,233,0.08)_48%,transparent_70%)]" />
          <div className="absolute left-5 top-8 h-24 w-px bg-white/30 sm:left-8 sm:h-28" />
          <div className="absolute left-10 top-8 h-px w-28 bg-white/25 sm:left-14 sm:w-36" />
          <div className="absolute left-4 top-24 h-px w-40 -rotate-12 bg-sky-200/25 sm:left-8 sm:w-52" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/30 to-black/5 dark:from-black/35 dark:to-black/10" />
        <div className="relative z-10 mb-5 mt-12 flex min-w-0 flex-col gap-1 sm:mt-15">
          <h1 className="break-words text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl">
            Welcome Back, {name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-5 text-white">
            {useManagerDashboard
              ? "Monitor team performance across your managed accounts."
              : "Track your assigned accounts and quality operations."}
          </p>
        </div>
      </header>
      <div className="relative z-10 mx-auto -mt-16 w-full px-3 sm:-mt-20 sm:px-6 md:px-9">
        <section className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {/* Render one summary stat tile per entry */}
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex min-h-[84px] items-center gap-3 rounded-xl border border-border-default bg-card px-4 py-3 shadow-sm"
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-[0_3px_8px_rgba(13,54,105,0.24)] ${stat.iconClassName}`}
              >
                <stat.icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium leading-4 text-text-secondary">
                  {stat.label}
                </p>
                <p className="mt-0.5 text-2xl font-bold leading-7 text-text-primary sm:text-[25px]">
                  {stat.value}
                </p>
                <p className={`mt-0.5 flex items-center gap-0.5 text-[11px] font-medium leading-4 ${stat.detailClassName}`}>
                  {stat.label === "Total Agents" && <ArrowUp className="h-3 w-3" aria-hidden="true" />}
                  {stat.detail}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-text-primary" aria-hidden="true" />
            </div>
          ))}
        </section>

        <section className="mt-7 rounded-2xl border border-border-default bg-card p-3 shadow-sm" aria-labelledby="analytics-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="analytics-heading"
              className={`border-l-4 ${a.border} pl-2 text-base font-bold leading-5 text-text-primary`}
            >
              Analytics
            </h2>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
              <div className="inline-flex min-w-0 flex-1 rounded-md border border-border-default bg-surface-raised p-0.5 sm:flex-none">
                {(["Daily", "Weekly", "Monthly"] as const).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => void handleTimeframeChange(tf)}
                    disabled={pendingTimeframe !== null}
                    aria-pressed={timeframe === tf}
                    aria-busy={pendingTimeframe === tf}
                    className={`min-w-0 flex-1 rounded px-2 py-1.5 text-xs font-semibold transition-colors sm:flex-none sm:px-3 ${
                      timeframe === tf
                        ? "bg-[var(--app-accent)] text-[var(--app-accent-contrast)] shadow-sm"
                        : "text-text-muted hover:text-text-primary disabled:cursor-wait disabled:opacity-60"
                    }`}
                  >
                    {pendingTimeframe === tf ? "Loading…" : tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filterError && (
            <p role="alert" className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">
              {filterError}. The previous filter data is still displayed.
            </p>
          )}

          <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <Card className="min-w-0 rounded-xl border border-border-default bg-card py-3 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between px-3 pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-md ${a.bgLight}`}
                  >
                    <TrendingUp size={14} className={a.text} />
                  </span>
                  <div>
                    <CardTitle className="text-xs font-semibold text-text-primary">
                      {liveOverview.isManager ? "QA Performance Trend" : "Agent Performance Trend"}
                    </CardTitle>
                    <p className="text-[11px] text-text-muted">Average QA Score</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[11px] text-text-muted">
                    Average Score
                  </span>
                  <span className={`block text-base font-bold leading-4 ${a.text}`}>
                    {filteredAvgScore != null
                      ? `${filteredAvgScore.toFixed(1)}%`
                      : "--"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-3">
                {filteredTrendData.length === 0 ? (
                  <div className="flex h-[180px] w-full items-center justify-center rounded-xl border border-dashed border-border-subtle bg-surface-raised/50">
                    <p className="text-sm font-semibold text-text-primary">
                      No data available
                    </p>
                  </div>
                ) : (
                  <ChartContainer
                    config={trendConfig}
                    className="h-[200px] w-full sm:h-[220px]"
                  >
                    <AreaChart
                      data={filteredTrendData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="fillScore"
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
                        stroke="var(--border-subtle)"
                        strokeDasharray="4 3"
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={4}
                        tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                        domain={["dataMin - 2", "dataMax + 2"]}
                        tickFormatter={(v: number) => `${v}%`}
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
                        fill="url(#fillScore)"
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
                      <ReferenceLine y={90} stroke="#E0A11A" strokeDasharray="3 3" />
                    </AreaChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="min-w-0 rounded-xl border border-border-default bg-card py-3 shadow-none">
              <CardHeader className="flex flex-row items-center gap-2 px-3 pb-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md ${a.bgLight}`}
                >
                  <ChartPie size={14} className={a.text} />
                </span>
                <CardTitle className="text-xs font-semibold text-text-primary">
                  Defect Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3">
                {liveOverview.charts.barData.length === 0 ? (
                  <div className="flex h-[180px] w-full items-center justify-center rounded-xl border border-dashed border-border-subtle bg-surface-raised/50">
                    <p className="text-sm font-semibold text-text-primary">
                      No data available
                    </p>
                  </div>
                ) : (
                  <div className="grid items-center gap-2 sm:grid-cols-[132px_1fr]">
                    <div className="relative h-[142px]">
                      <ChartContainer config={defectConfig} className="h-[142px] w-full">
                        <RechartsPieChart>
                          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                          <Pie data={liveOverview.charts.barData} dataKey="count" nameKey="defect" innerRadius={42} outerRadius={62} paddingAngle={2} strokeWidth={0}>
                            {liveOverview.charts.barData.map((item, index) => (
                              <Cell key={item.defect} fill={defectColors[index % defectColors.length]} />
                            ))}
                          </Pie>
                        </RechartsPieChart>
                      </ChartContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[11px] text-text-muted">Total</span>
                        <span className="text-xl font-bold leading-5 text-text-primary">{defectTotal}</span>
                      </div>
                    </div>
                    <div className="min-w-0 space-y-2 text-xs">
                      <div className="grid grid-cols-[minmax(0,1fr)_40px_40px] gap-2 border-b border-border-subtle pb-1 text-[11px] font-medium text-text-muted">
                        <span>Type</span><span>Count</span><span>%</span>
                      </div>
                      {liveOverview.charts.barData.map((item, index) => (
                        <div key={item.defect} className="grid grid-cols-[minmax(0,1fr)_40px_40px] gap-2 text-text-secondary">
                          <span className="flex min-w-0 items-center gap-1.5 truncate"><i className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: defectColors[index % defectColors.length] }} />{item.defect}</span>
                          <span>{item.count}</span>
                          <span>{defectTotal ? `${((item.count / defectTotal) * 100).toFixed(1)}%` : "0%"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
          <Card className="min-w-0 rounded-xl border border-border-default bg-card py-3 shadow-none">
            <CardHeader className="flex flex-col items-stretch justify-between gap-2 px-3 pb-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${a.bgLight}`}>
                <Trophy size={18} className={a.text} />
              </span>
              <div>
                <CardTitle className="text-xs font-semibold text-text-primary">
                  Top Performing Agents
                </CardTitle>
                <p className="text-[11px] text-text-muted">By average QA score</p>
              </div>
              </div>
              <button type="button" className="self-start rounded-md border border-border-default px-2 py-1.5 text-xs font-medium text-text-secondary sm:self-auto">View all</button>
            </CardHeader>
            <CardContent className="px-3">
              {liveOverview.charts.topAgents.length === 0 ? (
                <div className="flex h-[140px] items-center justify-center rounded-xl border border-dashed border-border-subtle bg-surface-raised/50">
                  <p className="text-sm font-semibold text-text-primary">No data available</p>
                </div>
              ) : (
                <div className="max-w-full overflow-x-auto overscroll-x-contain">
                  <div className="min-w-[440px] divide-y divide-border-subtle">
                    <div className="grid grid-cols-[44px_minmax(120px,1fr)_70px_62px_58px] gap-2 px-1 pb-1 text-[11px] font-medium text-text-muted">
                      <span>Rank</span>
                      <span>Agent</span>
                      <span>Account</span>
                      <span>QA Score</span>
                      <span>Trend</span>
                    </div>
                  {liveOverview.charts.topAgents.map((agent, idx) => (
                    <div key={idx} className="group grid grid-cols-[44px_minmax(120px,1fr)_70px_62px_58px] items-center gap-2 px-1 py-2 text-xs transition-colors">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${idx === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black" : idx === 1 ? "bg-gradient-to-br from-gray-300 to-gray-500 text-black" : "bg-gradient-to-br from-amber-600 to-amber-800 text-white"}`}>
                        {idx + 1}
                      </span>
                      <span className="flex min-w-0 items-center gap-2">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${a.bgLight} ${a.text}`}>
                          {agent.name.charAt(0)}
                        </span>
                        <span className="truncate font-medium text-text-primary group-hover:text-[var(--app-accent)] transition-colors">{agent.name}</span>
                      </span>
                      <span className="text-text-muted">—</span>
                      <span className={`font-bold ${a.text}`}>{agent.score}</span>
                      <span className="text-emerald-700">—</span>
                    </div>
                  ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="min-w-0 rounded-xl border border-border-default bg-card py-3 shadow-none">
            <CardHeader className="flex flex-col items-stretch justify-between gap-2 px-3 pb-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-crimson/10">
                <AlertTriangle size={18} className="text-brand-crimson" />
              </span>
              <div>
                <CardTitle className="text-xs font-semibold text-text-primary">
                  Needs Attention
                </CardTitle>
                <p className="text-[11px] text-text-muted">Lowest average QA scores</p>
              </div>
              </div>
              <button type="button" className="self-start rounded-md border border-border-default px-2 py-1.5 text-xs font-medium text-text-secondary sm:self-auto">View all</button>
            </CardHeader>
            <CardContent className="px-3">
              {liveOverview.charts.bottomAgents.length === 0 ? (
                <div className="flex h-[140px] items-center justify-center rounded-xl border border-dashed border-border-subtle bg-surface-raised/50">
                  <p className="text-sm font-semibold text-text-primary">No data available</p>
                </div>
              ) : (
                <div className="max-w-full overflow-x-auto overscroll-x-contain">
                  <div className="min-w-[470px] divide-y divide-border-subtle">
                    <div className="grid grid-cols-[minmax(120px,1fr)_70px_62px_82px_54px] gap-2 px-1 pb-1 text-[11px] font-medium text-text-muted">
                      <span>Agent</span>
                      <span>Account</span>
                      <span>QA Score</span>
                      <span>vs Prev. 30 Days</span>
                      <span>Action</span>
                    </div>
                  {liveOverview.charts.bottomAgents.map((agent, idx) => (
                    <div key={idx} className="group grid grid-cols-[minmax(120px,1fr)_70px_62px_82px_54px] items-center gap-2 px-1 py-2 text-xs transition-colors">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-crimson text-[11px] font-bold text-white">
                          {agent.name.charAt(0)}
                        </span>
                        <span className="truncate font-medium text-text-primary group-hover:text-brand-crimson transition-colors">{agent.name}</span>
                      </span>
                      <span className="text-text-muted">—</span>
                      <span className="font-bold text-brand-crimson">{agent.score}</span>
                      <span className="text-text-muted">—</span>
                      <button type="button" aria-label={`View ${agent.name}`} className="rounded border border-border-default px-1.5 py-1 text-[11px] font-medium text-text-secondary">View</button>
                    </div>
                  ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
