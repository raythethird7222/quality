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
  UsersRound,
} from "lucide-react";
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

  const searchSummary =
    search.trim().length > 0
      ? `${filteredMembers.length} matches for "${search.trim()}"`
      : `${members.length} members in scope`;

  return (
    <div className="min-h-full bg-surface-base text-text-primary">
      <div className="w-full px-6 py-5 md:px-9">
        <Breadcrumb
          backHref="/dashboard"
          segments={[{ label: account }]}
          accent={selectedAccent}
        />

        <section className="mt-5 space-y-5">
          <div className="relative overflow-hidden rounded-[28px] border border-border-default bg-card shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(47,103,152,0.12),transparent_34%,transparent_68%,rgba(200,165,75,0.14))]" />
            <div className="pointer-events-none absolute -right-12 top-0 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(47,103,152,0.16),transparent_70%)] blur-2xl" />
            <div className="relative grid gap-6 p-6 md:p-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)] xl:items-end">
              <div className="space-y-7">
                <div className="flex items-start gap-4">
                  <span
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${a.bgLight} ${a.text} ring-1 ring-inset ring-current/15 shadow-sm`}
                  >
                    <ShieldCheck className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h1 className="text-[30px] font-bold tracking-tight text-text-primary sm:text-[38px]">
                      {account} Manager Dashboard
                    </h1>
                    <p className="mt-2 max-w-2xl text-[14px] leading-6 text-text-secondary">
                      Monitor QA coverage, team capacity, and account-level
                      performance from one focused view.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-border-subtle pt-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                      Agents
                    </p>
                    <p className="mt-1 text-2xl font-bold text-text-primary">{agents}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                      QAs
                    </p>
                    <p className={`mt-1 text-2xl font-bold ${a.text}`}>{qaCount}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                      Inactive
                    </p>
                    <p className="mt-1 text-2xl font-bold text-text-primary">{inactiveAgents}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border-subtle bg-surface-raised/70 p-5 shadow-sm backdrop-blur-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[15px] font-bold text-text-primary">Team snapshot</p>
                    <p className="mt-2 text-[13px] leading-5 text-text-secondary">
                      Review assignments and open a QA dashboard when you need more detail.
                    </p>
                  </div>
                  <Link
                    href={`/accounts/${unit}/analytics`}
                    className={`inline-flex items-center gap-2 rounded-full border ${a.border} bg-card px-4 py-2 text-[12px] font-semibold ${a.text} shadow-sm transition ${a.hoverBg}`}
                  >
                    <BarChart3 className="h-4 w-4" aria-hidden="true" />
                    Analytics
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>

                <div className="mt-7 rounded-2xl border border-border-subtle bg-card px-4 py-3">
                  <div className="flex items-center justify-between gap-4 text-[12px]">
                    <span className="font-medium text-text-secondary">Active agents</span>
                    <span className="font-semibold text-text-primary">
                      {Math.max(agents - inactiveAgents, 0)} of {agents}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-overlay">
                    <div
                      className={`h-full rounded-full ${a.bg} transition-all duration-300`}
                      style={{
                        width: `${agents > 0 ? Math.max(0, Math.min(100, Math.round(((agents - inactiveAgents) / agents) * 100))) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-border-default bg-card shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 border-b border-border-subtle bg-[linear-gradient(180deg,rgba(255,255,255,0.18),transparent)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
              <div>
                <h2 className="text-[17px] font-bold text-text-primary">
                  QA Team
                </h2>
                <p className="mt-1 text-[13px] text-text-secondary">
                  {searchSummary}
                </p>
              </div>
              <label className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <span className="sr-only">Search QA team members</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search QA members"
                  className="h-11 w-full rounded-full border border-border-default bg-surface-raised pl-9 pr-3 text-[13px] font-medium text-text-primary outline-none transition placeholder:text-text-muted focus:border-app-accent focus:ring-2 focus:ring-app-accent/15"
                />
              </label>
            </div>

            {members.length === 0 ? (
              <div className="m-5 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border-default bg-surface-raised px-6 py-14 text-center md:m-6">
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
              <div className="m-5 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border-default bg-surface-raised px-6 py-14 text-center md:m-6">
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
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border-default bg-surface-raised/70 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-border-accent hover:shadow-lg"
                    >
                      <div className="border-b border-border-subtle bg-card px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-3">
                            <span
                              className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${a.bg} text-[18px] font-bold text-white shadow-sm ring-1 ring-inset ring-white/15`}
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
                            className={`h-8 w-8 ${a.text} opacity-80 transition group-hover:scale-105`}
                            aria-hidden="true"
                          />
                        </div>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-overlay">
                          <div
                            className={`h-full rounded-full ${a.bg} transition-all duration-300`}
                            style={{
                              width: `${Math.max(18, Math.min(100, Math.round((member.agents / Math.max(agents, 1)) * 100)))}%`,
                            }}
                          />
                        </div>
                        <Link
                          href={`/accounts/${unit}/dashboard?qaId=${member.employeeId ?? ""}`}
                          className={`mt-5 inline-flex items-center justify-center gap-2 rounded-full border ${a.border} bg-card px-3 py-2.5 text-[13px] font-semibold ${a.text} transition ${a.hoverBg}`}
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
