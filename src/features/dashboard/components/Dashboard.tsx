"use client";

// Operator dashboard: profile, summary stats, and analytics charts.
import { useEffect, useRef, useState } from "react";
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
  CalendarDays,
  ShieldCheck,
  TrendingUp,
  Upload,
  UsersRound,
  Zap,
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
import { useAuth } from "@/features/auth/context/AuthContext";
import { getAccentColors } from "@/features/accounts/config";
import AvatarCropModal from "@/components/ui/avatar-crop-modal";
import { useAccent, useAccentHex } from "@/features/settings/useAccent";
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
  const { updateUser } = useAuth();
  // Live overview state — updated via Supabase Realtime.
  const [liveOverview, setLiveOverview] =
    useState<DashboardOverview>(overview);
  // Hidden file input ref used to trigger the avatar file picker.
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Currently displayed avatar URL (overridden by the cropped upload).
  const [avatarImage, setAvatarImage] = useState<string | null>(
    user?.avatar_url ?? null
  );
  // Source image for the crop modal, or null when the modal is closed.
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  // True while the cropped avatar is being uploaded to the server.
  const [avatarSaving, setAvatarSaving] = useState(false);
  // Holds an error message from a failed avatar upload, if any.
  const [avatarError, setAvatarError] = useState<string | null>(null);
  // True after first client render, used to avoid SSR/CSR time mismatches.
  const [mounted, setMounted] = useState(false);
  // Live clock value, ticking every second for the "last accessed" display.
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect -- Standard hydration pattern
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Full human-readable "last accessed" label used for the tooltip.
  const lastAccessedLabel = `Last accessed ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;

  // Display name falls back to "Operator" when no employee name is set.
  const name = user?.employee_name ?? "Operator";
  // Derive up-to-two-letter initials from the display name.
  const initials = name
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Resolve the active theme accent, raw hex, and mapped color classes.
  const selectedAccent = useAccent();
  const accentHex = useAccentHex();
  const a = getAccentColors(selectedAccent);
  // Switch the welcome copy based on whether the user is a manager.
  const useManagerDashboard = liveOverview.isManager;

  const displayedAvatar = avatarImage ?? user?.avatar_url ?? null;

  // Reads a selected image file and opens the avatar crop modal.
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  // Uploads the cropped avatar and updates the user's profile.
  const handleAvatarSave = async (dataUrl: string) => {
    setAvatarSaving(true);
    setAvatarError(null);
    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Failed to save avatar");
      }
      setAvatarImage(data.avatarUrl);
      updateUser({ avatar_url: data.avatarUrl });
      setCropImageSrc(null);
    } catch (error) {
      console.error("Avatar upload failed:", error);
      setAvatarError(
        error instanceof Error ? error.message : "Failed to save avatar"
      );
    } finally {
      setAvatarSaving(false);
    }
  };

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
    <main className="min-h-full bg-surface-base px-6 py-5 text-text-primary md:px-9">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-[32px] font-bold leading-none tracking-tight sm:text-[36px]">
              Welcome Back, {name}
            </h1>
            <p className="mt-2 text-[13px] leading-5 text-text-secondary">
              {useManagerDashboard
                ? "Monitor team performance across your managed accounts."
                : "Track your assigned accounts and quality operations."}
            </p>
          </div>
        </header>

        <section
          className="mt-5 rounded-2xl border border-border-default bg-card px-6 py-5 shadow-sm"
          aria-label="Operator profile"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-8">
              <button
                type="button"
                 // Open the hidden file picker to choose a new avatar image.
                 onClick={() => fileInputRef.current?.click()}
                className={`group relative grid h-[118px] w-[118px] shrink-0 place-items-center rounded-full border-2 ${a.border} bg-surface-raised outline outline-2 outline-offset-[8px] outline-dashed outline-brand-gold/90`}
                aria-label="Upload profile photo"
              >
                {displayedAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element -- User-uploaded avatar preview
                  <img
                    src={displayedAvatar}
                    alt="Operator profile"
                    className="h-[110px] w-[110px] rounded-full object-cover"
                  />
                ) : (
                  <span className={`text-[42px] font-medium ${a.text} transition group-hover:opacity-0`}>
                    {initials}
                  </span>
                )}
                <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45 opacity-0 transition group-hover:opacity-100">
                  <Upload className="h-5 w-5 text-white" />
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div>
                <p className="text-[28px] font-bold leading-none tracking-tight sm:text-[30px]">
                  {name}
                </p>
                <p className={`mt-3 text-[15px] font-medium ${a.text}`}>
                  QA ID: {user?.employee_code ?? "--"}
                </p>
                <p className={`mt-7 text-[15px] ${a.text}`}>
                  {user?.employee_email ?? "--"}
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-5 ${a.border} md:min-w-[330px] md:border-l-2 md:py-7 md:pl-8`}>
              <span className={`grid h-[60px] w-[60px] place-items-center rounded-xl ${a.bg} text-white`}>
                <CalendarDays
                  className="h-9 w-9 stroke-[2.5]"
                  aria-hidden="true"
                />
              </span>
              <p
                className="text-[17px] leading-[1.55] text-text-primary"
                title={mounted ? lastAccessedLabel : "Last Accessed"}
              >
                Last Accessed
                <br />
                {mounted
                  ? `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
                  : "--"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Render one summary stat tile per entry */}
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-2xl border border-border-default bg-card px-5 py-4 shadow-sm"
            >
              <p className="text-[13px] text-text-secondary">{stat.label}</p>
              <p className={`mt-2 text-[32px] font-bold ${a.text}`}>
                {stat.value}
              </p>
              <stat.icon
                className={`absolute bottom-4 right-5 h-9 w-9 ${a.bgLight} ${a.text}`}
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
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border border-border-default bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.bgLight}`}
                  >
                    <TrendingUp size={16} className={a.text} />
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
                    {liveOverview.charts.avgScore != null
                      ? `${liveOverview.charts.avgScore.toFixed(1)}%`
                      : "--"}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {liveOverview.charts.trendData.length === 0 ? (
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
                    data={liveOverview.charts.trendData}
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
                      dataKey="month"
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
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.bgLight}`}
                >
                  <BarChart3 size={16} className={a.text} />
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
      </div>

      {cropImageSrc && (
        <AvatarCropModal
          open
          imageSrc={cropImageSrc}
          saving={avatarSaving}
          error={avatarError}
          onCancel={() => {
            setCropImageSrc(null);
            setAvatarError(null);
          }}
          onSave={handleAvatarSave}
        />
      )}
    </main>
  );
}
