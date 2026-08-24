"use client";

import Link from "next/link";
import { BarChart3, LineChart, ShieldCheck, UsersRound } from "lucide-react";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { getAccentColors } from "@/features/accounts/config";
import { useAccent } from "@/features/settings/useAccent";
import type { TeamMember } from "@/types";

type ManagerDashboardProps = {
  account: string;
  agents: number;
  qaCount: number;
  members: TeamMember[];
};

export default function ManagerDashboard({
  account,
  agents,
  qaCount,
  members,
}: ManagerDashboardProps) {
  const unit = account.toLowerCase();
  const selectedAccent = useAccent();
  const a = getAccentColors(selectedAccent);

  return (
    <div className="min-h-full bg-surface-base text-text-primary">
      <div className="mx-auto max-w-[1440px] px-6 py-5 md:px-9">
        <Breadcrumb
          backHref="/dashboard"
          segments={[{ label: account }]}
          accent={selectedAccent}
        />

        <section className="mt-5 rounded-2xl border border-border-default bg-card p-6 shadow-sm md:p-7">
          <div className="flex flex-col justify-between gap-6 border-b border-border-subtle pb-5 lg:flex-row">
            <div>
              <h1 className="text-[22px] font-bold tracking-tight text-text-primary">
                Manager Dashboard
              </h1>
              <p className="mt-1 text-[13px] text-text-secondary">
                QA Team Overview
              </p>
            </div>

            <div className="w-full max-w-[412px]">
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Total Agents"
                  value={agents}
                  icon={UsersRound}
                  a={a}
                />
                <StatCard
                  label="Total QAs"
                  value={qaCount}
                  icon={ShieldCheck}
                  a={a}
                />
              </div>
              <Link
                href={`/accounts/${unit}/analytics`}
                className={`mt-3 flex items-center justify-center gap-2 rounded-lg border ${a.border} bg-card px-3 py-2.5 text-[13px] font-semibold ${a.text} transition ${a.hoverBg}`}
              >
                <BarChart3 className="h-4 w-4" />
                Manager Analytics
              </Link>
            </div>
          </div>

          {members.length === 0 ? (
            <div className="mt-5 flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border-default bg-card px-6 py-12 text-center shadow-sm">
              <p className="text-[15px] font-semibold text-text-primary">
                No QA team members
              </p>
              <p className="mt-1 text-[13px] text-text-secondary">
                QA team overview will appear here once members are assigned.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((member, i) => {
                const m = a;
                return (
                  <article
                    key={member.name}
                    className="flex h-full flex-col rounded-2xl border border-border-default bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between border-b border-border-subtle pb-4">
                      <div className="flex items-start gap-3">
                        <span
                          className={`grid h-14 w-14 place-items-center rounded-full ${m.bg} text-[20px] font-bold text-white`}
                        >
                          {member.initial}
                        </span>
                        <div>
                          <h2 className="text-[15px] font-bold text-text-primary">
                            {member.name}
                          </h2>
                          <span
                            className={`mt-1 inline-flex rounded-full ${m.bgLight} px-2 py-0.5 text-[11px] font-bold ${m.text}`}
                          >
                            ACTIVE
                          </span>
                        </div>
                      </div>
                      <UsersRound className={`h-5 w-5 ${m.text}`} />
                    </div>
                    <p className="mt-4 text-[13px] text-text-secondary">
                      Total Agents
                    </p>
                    <p className={`mt-1 text-[28px] font-bold ${m.text}`}>
                      {member.agents}
                    </p>
                    <div className="mt-auto pt-3">
                      <Link
                        href={`/accounts/${unit}/dashboard`}
                        className={`flex items-center justify-center gap-2 rounded-lg border ${m.border} bg-card px-3 py-2.5 text-[13px] font-semibold ${m.text} transition ${m.hoverBg}`}
                      >
                        <LineChart className="h-4 w-4" />
                        View Dashboard
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  a,
}: {
  label: string;
  value: number;
  icon: typeof UsersRound;
  a: { text: string; bg: string; bgLight: string; hex: string };
}) {
  return (
    <div className="relative rounded-2xl border border-border-default bg-card px-5 py-4 shadow-sm">
      <p className="text-[13px] text-text-secondary">{label}</p>
      <p className={`mt-2 text-[28px] font-bold ${a.text}`}>{value}</p>
      <Icon
        className={`absolute bottom-4 right-5 h-8 w-8 ${a.bgLight} ${a.text}`}
      />
    </div>
  );
}
