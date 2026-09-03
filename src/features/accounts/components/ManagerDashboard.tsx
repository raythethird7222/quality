"use client";

// Manager dashboard view: account overview with QA team stats and member cards.
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  LineChart,
  Search,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { getAccentColors } from "@/features/accounts/config";
import { useAccent } from "@/features/settings/useAccent";
import type { TeamMember } from "@/types";

// Props for the manager dashboard: account name, counts, and QA member list.
type ManagerDashboardProps = {
  account: string;
  agents: number;
  inactiveAgents: number;
  qaCount: number;
  members: TeamMember[];
};

// Main manager dashboard: renders account header, summary stats, and QA member grid.
export default function ManagerDashboard({
  account,
  agents,
  inactiveAgents,
  qaCount,
  members,
}: ManagerDashboardProps) {
  // Normalize account name into a URL-safe slug for navigation links.
  const unit = account.toLowerCase();
  // Resolve the active theme accent and its mapped color utility classes.
  const selectedAccent = useAccent();
  const a = getAccentColors(selectedAccent);
  const [search, setSearch] = useState("");
  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members;
    return members.filter((member) =>
      `${member.name} ${member.initial} ${member.employeeCode ?? ""} ${member.employeeId ?? ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [members, search]);

  return (
    <div className="min-h-full bg-surface-base text-text-primary">
      <div className="mx-auto max-w-[1440px] px-6 py-5 md:px-9">
        <Breadcrumb
          backHref="/dashboard"
          segments={[{ label: account }]}
          accent={selectedAccent}
        />

        <section className="mt-5 space-y-5">
          <div className="relative overflow-hidden rounded-2xl border border-border-default bg-card p-5 shadow-sm md:p-7">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(47,103,152,0.18),transparent_58%)]" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-start gap-4">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${a.bgLight} ${a.text} ring-1 ring-inset ring-current/20`}
                >
                  <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <h1 className="mt-1 text-[26px] font-bold tracking-tight text-text-primary sm:text-[32px]">
                    {account} Manager Dashboard
                  </h1>
                  <p className="mt-1 max-w-2xl text-[13px] leading-5 text-text-secondary">
                    Monitor QA coverage, team capacity, and account-level
                    performance from one focused view.
                  </p>
                </div>
              </div>

              <Link
                href={`/accounts/${unit}/analytics`}
                className={`inline-flex items-center justify-center gap-2 rounded-lg border ${a.border} bg-card px-4 py-2.5 text-[13px] font-semibold ${a.text} shadow-sm transition ${a.hoverBg}`}
              >
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                Manager Analytics
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              label="Total Agents"
              value={agents}
              helper="Assigned to this account"
              icon={UsersRound}
              a={a}
            />
            <StatCard
              label="Total QAs"
              value={qaCount}
              helper="Active quality reviewers"
              icon={ShieldCheck}
              a={a}
            />
            <StatCard
              label="Inactive Agents"
              value={inactiveAgents}
              helper="Not currently active"
              icon={UserCheck}
              a={a}
            />
          </div>

          <div className="rounded-2xl border border-border-default bg-card shadow-sm">
            <div className="flex flex-col gap-4 border-b border-border-subtle px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
              <div>
                <h2 className="text-[17px] font-bold text-text-primary">
                  QA Team
                </h2>
                <p className="mt-1 text-[13px] text-text-secondary">
                  {filteredMembers.length} of {members.length} members shown
                </p>
              </div>
              <label className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <span className="sr-only">Search QA team members</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search QA members"
                  className="h-10 w-full rounded-lg border border-border-default bg-surface-raised pl-9 pr-3 text-[13px] font-medium text-text-primary outline-none transition placeholder:text-text-muted focus:border-app-accent focus:ring-2 focus:ring-app-accent/15"
                />
              </label>
            </div>

            {members.length === 0 ? (
              <div className="m-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-raised px-6 py-12 text-center md:m-6">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${a.bgLight} ${a.text}`}
                >
                  <UsersRound className="h-6 w-6" aria-hidden="true" />
                </span>
                <p className="mt-3 text-[15px] font-semibold text-text-primary">
                  No QA team members
                </p>
                <p className="mt-1 max-w-md text-[13px] leading-5 text-text-secondary">
                  QA team overview will appear here once members are assigned.
                </p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="m-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-raised px-6 py-12 text-center md:m-6">
                <p className="text-[15px] font-semibold text-text-primary">
                  No members found
                </p>
                <p className="mt-1 text-[13px] text-text-secondary">
                  Try a different name, initial, or employee ID.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 p-5 md:p-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Map each QA team member to a profile card with agent count and link */}
                {filteredMembers.map((member, index) => {
                  const memberKey =
                    member.employeeCode != null
                      ? `member-${member.employeeCode}`
                      : `member-${member.name}-${index}`;
                  return (
                    <article
                      key={memberKey}
                      className="flex h-full flex-col overflow-hidden rounded-xl border border-border-default bg-surface-raised shadow-sm transition hover:-translate-y-0.5 hover:border-border-accent hover:shadow-md"
                    >
                      <div className="border-b border-border-subtle bg-card px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-3">
                            <span
                              className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${a.bg} text-[18px] font-bold text-white shadow-sm`}
                            >
                              {member.initial}
                            </span>
                            <div className="min-w-0">
                              <h3 className="truncate text-[15px] font-bold text-text-primary">
                                {member.name}
                              </h3>
                              <p className="mt-0.5 text-[12px] font-medium text-text-muted">
                                Employee ID: {member.employeeCode ?? "—"}
                              </p>
                            </div>
                          </div>
                          <span
                            className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                          >
                            ACTIVE
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col px-5 py-4">
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <p className="text-[12px] font-medium text-text-muted">
                              Assigned agents
                            </p>
                            <p className={`mt-1 text-[30px] font-bold ${a.text}`}>
                              {member.agents}
                            </p>
                          </div>
                          <UsersRound
                            className={`h-8 w-8 ${a.text} opacity-80`}
                            aria-hidden="true"
                          />
                        </div>
                        <Link
                          href={`/accounts/${unit}/dashboard?qaId=${member.employeeId ?? ""}`}
                          className={`mt-5 inline-flex items-center justify-center gap-2 rounded-lg border ${a.border} bg-card px-3 py-2.5 text-[13px] font-semibold ${a.text} transition ${a.hoverBg}`}
                        >
                          <LineChart className="h-4 w-4" aria-hidden="true" />
                          View Dashboard
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// Compact stat tile used in the dashboard summary header.
// Props for the compact stat tile.
function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  a,
}: {
  label: string;
  value: number;
  helper: string;
  icon: LucideIcon;
  a: { text: string; bg: string; bgLight: string; hex: string };
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-default bg-card px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-text-secondary">{label}</p>
          <p className={`mt-2 text-[30px] font-bold ${a.text}`}>{value}</p>
          <p className="mt-1 text-[12px] text-text-muted">{helper}</p>
        </div>
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${a.bgLight} ${a.text}`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}
