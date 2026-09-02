"use client";

// Operator dashboard: summary stats and analytics charts.
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  ShieldCheck,
  TrendingUp,
  Trophy,
  UsersRound,
  UserX,
  Zap,
  AlertTriangle,
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
        fetch("/api/dashboard")
          .then((res) => res.json())
          .then((data) => {
            if (data.overview) setLiveOverview(data.overview);
          })
          .catch(console.error);
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
  }, []);

  // Display name falls back to "Operator" when no employee name is set.
  const name = user?.employee_name ?? "Operator";

  // Resolve the active theme accent, raw hex, and mapped color classes.
  const selectedAccent = useAccent();
  const accentHex = useAccentHex();
  const a = getAccentColors(selectedAccent);
  // Switch the welcome copy based on whether the user is a manager.
  const useManagerDashboard = liveOverview.isManager;

  const [timeframe, setTimeframe] = useState<"Daily" | "Weekly" | "Monthly">("Daily");

  const getDateKey = (dateStr: string, tf: string): string => {
    if (!dateStr) return "Unknown";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "Unknown";
    if (tf === "Weekly") {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diff);
      if (Number.isNaN(monday.getTime())) return "Unknown";
      return monday.toISOString().slice(0, 10);
    }
    if (tf === "Monthly") return dateStr.slice(0, 7);
    if (tf === "Quarterly") {
      const q = Math.floor(d.getMonth() / 3) + 1;
      return `${d.getFullYear()}-Q${q}`;
    }
    if (tf === "Yearly") return dateStr.slice(0, 4);
    return dateStr;
  };

  const filteredTrendData = (() => {
    const trendMap = new Map<string, { sum: number; n: number }>();
    for (const e of liveOverview.charts.trendData) {
      const key = getDateKey(e.month, timeframe);
      const cur = trendMap.get(key) ?? { sum: 0, n: 0 };
      cur.sum += e.score;
      cur.n += 1;
      trendMap.set(key, cur);
    }
    return [...trendMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, value: Number((v.sum / v.n).toFixed(2)) }));
  })();

  const filteredAvgScore = filteredTrendData.length > 0
    ? Number((filteredTrendData.reduce((s, d) => s + d.value, 0) / filteredTrendData.length).toFixed(2))
    : null;

  // Summary stat tiles: account/agent/QA counts pulled from the overview.
  const stats = [
    {
      label: "Total Accounts",
      value: liveOverview.accounts.length,
      icon: Zap,
    },
    {
      label: "Total Agents",
      value: liveOverview.totalAgents,
      icon: UsersRound,
    },
    {
      label: "Inactive Agents",
      value: liveOverview.totalInactiveAgents,
      icon: UserX,
    },
    {
      label: "Total QAs",
      value: liveOverview.totalQAs,
      icon: ShieldCheck,
    },
  ];

  const trendConfig = {
    score: { label: "QA Score", color: accentHex },
  } satisfies ChartConfig;

  const defectConfig = {
    count: { label: "Count", color: accentHex },
  } satisfies ChartConfig;

  return (
    <main className="min-h-full bg-surface-base mb-10 text-text-primary">
      <header
        className="relative flex items-start justify-between gap-6 h-60 md:px-9 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.75), rgba(0,0,0,0.2)), url('https://zhdmsmwrskxowvytedgh.supabase.co/storage/v1/object/public/Images/hero_dashboard.png')`,
        }}
      >
        <div className="flex flex-col gap-1 mb-5 mt-15">
          <h1 className="text-[32px] font-bold leading-none tracking-tight text-white sm:text-[36px]">
            Welcome Back, {name}
          </h1>
          <p className="mt-2 text-[13px] leading-5 text-white/80">
            {useManagerDashboard
              ? "Monitor team performance across your managed accounts."
              : "Track your assigned accounts and quality operations."}
          </p>
        </div>
      </header>
      <div className="mx-auto mt-[-80px]  md:px-9">
        <section className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Render one summary stat tile per entry */}
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-2xl border border-border-default bg-card px-5 py-4 shadow-sm"
            >
              <p className="text-[13px] text-text-secondary">{stat.label}</p>
              <p className={`mt-2 text-[45px] font-bold ${a.text}`}>
                {stat.value}
              </p>
              <stat.icon
                className={`absolute right-[-25px] top-1/2 h-25 w-25 -translate-y-1/2 ${a.text} opacity-20`}
                aria-hidden="true"
              />
            </div>
          ))}
        </section>

        <section className="mt-7" aria-labelledby="analytics-heading">
          <div className="flex items-center justify-between">
            <h2
              id="analytics-heading"
              className={`border-l-[7px] ${a.border} pl-2 text-[26px] font-semibold leading-8 text-text-primary`}
            >
              Analytics
            </h2>
            <div className="inline-flex rounded-lg border border-border-default bg-surface-raised p-0.5">
              {(["Daily", "Weekly", "Monthly"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                    timeframe === tf
                      ? "rounded-md bg-card text-text-primary shadow-sm"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border border-border-default bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${a.bgLight}`}
                  >
                    <TrendingUp size={20} className={a.text} />
                  </span>
                  <CardTitle className="text-sm font-semibold text-text-primary">
                    {liveOverview.isManager
                      ? "QA Performance Trend"
                      : "Agent Performance Trend"}
                  </CardTitle>
                </div>
                <div className="rounded-lg bg-surface-raised px-3 py-1.5 text-right">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Avg
                  </span>
                  <span className={`block text-sm font-bold ${a.text}`}>
                    {filteredAvgScore != null
                      ? `${filteredAvgScore.toFixed(1)}%`
                      : "--"}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {filteredTrendData.length === 0 ? (
                  <div className="flex h-[220px] w-full items-center justify-center rounded-xl border border-dashed border-border-subtle bg-surface-raised/50">
                    <p className="text-sm font-semibold text-text-primary">
                      No data available
                    </p>
                  </div>
                ) : (
                  <ChartContainer
                    config={trendConfig}
                    className="h-[220px] w-full"
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
                        dataKey="score"
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
                    </AreaChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-border-default bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${a.bgLight}`}
                >
                  <BarChart3 size={20} className={a.text} />
                </span>
                <CardTitle className="text-sm font-semibold text-text-primary">
                  Defect Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {liveOverview.charts.barData.length === 0 ? (
                  <div className="flex h-[220px] w-full items-center justify-center rounded-xl border border-dashed border-border-subtle bg-surface-raised/50">
                    <p className="text-sm font-semibold text-text-primary">
                      No data available
                    </p>
                  </div>
                ) : (
                  <ChartContainer
                    config={defectConfig}
                    className="h-[220px] w-full"
                  >
                    <BarChart
                      data={liveOverview.charts.barData}
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
          </div>
        </section>

        <section className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl border border-border-default bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center gap-2 pb-4">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${a.bgLight}`}>
                <Trophy size={18} className={a.text} />
              </span>
              <div>
                <CardTitle className="text-sm font-semibold text-text-primary">
                  TOP PERFORMING AGENTS
                </CardTitle>
                <p className="text-[11px] text-text-muted">Highest average QA scores</p>
              </div>
            </CardHeader>
            <CardContent>
              {liveOverview.charts.topAgents.length === 0 ? (
                <div className="flex h-[140px] items-center justify-center rounded-xl border border-dashed border-border-subtle bg-surface-raised/50">
                  <p className="text-sm font-semibold text-text-primary">No data available</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {liveOverview.charts.topAgents.map((agent, idx) => (
                    <div key={idx} className="group flex items-center justify-between rounded-xl border border-border-default bg-surface-raised px-4 py-3 transition-colors hover:border-[var(--app-accent)]">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ${idx === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-600" : idx === 1 ? "bg-gradient-to-br from-gray-300 to-gray-500" : "bg-gradient-to-br from-amber-600 to-amber-800"}`}>
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-text-primary group-hover:text-[var(--app-accent)] transition-colors">{agent.name}</span>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${a.bgLight} ${a.text}`}>{agent.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border-default bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center gap-2 pb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-crimson/10">
                <AlertTriangle size={18} className="text-brand-crimson" />
              </span>
              <div>
                <CardTitle className="text-sm font-semibold text-text-primary">
                  NEEDS ATTENTION
                </CardTitle>
                <p className="text-[11px] text-text-muted">Lowest average QA scores</p>
              </div>
            </CardHeader>
            <CardContent>
              {liveOverview.charts.bottomAgents.length === 0 ? (
                <div className="flex h-[140px] items-center justify-center rounded-xl border border-dashed border-border-subtle bg-surface-raised/50">
                  <p className="text-sm font-semibold text-text-primary">No data available</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {liveOverview.charts.bottomAgents.map((agent, idx) => (
                    <div key={idx} className="group flex items-center justify-between rounded-xl border border-border-default bg-surface-raised px-4 py-3 transition-colors hover:border-brand-crimson/50">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-crimson text-sm font-bold text-white shadow-sm">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-text-primary group-hover:text-brand-crimson transition-colors">{agent.name}</span>
                      </div>
                      <span className="rounded-full bg-brand-crimson/10 px-2.5 py-1 text-xs font-bold text-brand-crimson">{agent.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
