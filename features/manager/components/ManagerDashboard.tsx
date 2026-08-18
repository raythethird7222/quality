"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3, LineChart, ShieldCheck, UsersRound } from "lucide-react";

type TeamMember = {
  name: string;
  initial: string;
  agents: number;
};

type ManagerDashboardProps = {
  account: string;
  agents: number;
  qaCount: number;
  members: TeamMember[];
  accent: string;
};

const accentMap: Record<string, { text: string; bg: string; border: string; hoverBg: string; bgLight: string; hex: string }> = {
  "#C8A54B": { text: "text-brand-gold", bg: "bg-brand-gold", border: "border-brand-gold", hoverBg: "hover:bg-brand-gold/10", bgLight: "bg-brand-gold/10", hex: "#C8A54B" },
  "#2F6798": { text: "text-brand-indigo", bg: "bg-brand-indigo", border: "border-brand-indigo", hoverBg: "hover:bg-brand-indigo/10", bgLight: "bg-brand-indigo/10", hex: "#2F6798" },
  "#ED1C25": { text: "text-brand-crimson", bg: "bg-brand-crimson", border: "border-brand-crimson", hoverBg: "hover:bg-brand-crimson/10", bgLight: "bg-brand-crimson/10", hex: "#ED1C25" },
  "#363435": { text: "text-brand-charcoal", bg: "bg-brand-charcoal", border: "border-brand-charcoal", hoverBg: "hover:bg-brand-charcoal/10", bgLight: "bg-brand-charcoal/10", hex: "#363435" },
};

export default function ManagerDashboard({ account, agents, qaCount, members, accent }: ManagerDashboardProps) {
  const a = accentMap[accent] ?? accentMap["#2F6798"];
  const unit = account.toLowerCase();

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <div className="mx-auto max-w-[1440px] px-6 py-5 md:px-9">
        <nav className="flex flex-wrap items-center gap-3 text-[13px]" aria-label="Breadcrumb">
          <Link
            href="/"
            className={`inline-flex items-center gap-2 rounded-lg border ${a.border} bg-white px-3.5 py-2 font-medium ${a.text} transition ${a.hoverBg}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Return back
          </Link>
          <div className="flex items-center gap-2 text-text-muted">
            <Link href="/" className="transition hover:text-brand-indigo">Home</Link>
            <span>/</span>
            <span className={`font-semibold ${a.text}`}>{account}</span>
          </div>
        </nav>

        <section className="mt-5 rounded-2xl border border-border-default bg-white p-6 shadow-sm md:p-7">
          <div className="flex flex-col justify-between gap-6 border-b border-border-subtle pb-5 lg:flex-row">
            <div>
              <h1 className="text-[22px] font-bold tracking-tight text-text-primary">Manager Dashboard</h1>
              <p className="mt-1 text-[13px] text-text-secondary">QA Team Overview</p>
            </div>

            <div className="w-full max-w-[412px]">
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Total Agents" value={agents} icon={UsersRound} a={a} />
                <StatCard label="Total QAs" value={qaCount} icon={ShieldCheck} a={a} />
              </div>
              <Link
                href={`/${unit}/analytics`}
                className={`mt-3 flex items-center justify-center gap-2 rounded-lg border ${a.border} bg-white px-3 py-2.5 text-[13px] font-semibold ${a.text} transition ${a.hoverBg}`}
              >
                <BarChart3 className="h-4 w-4" />
                Manager Analytics
              </Link>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-4">
            {members.map((member) => (
              <article
                key={member.name}
                className={`w-[254px] rounded-xl border ${a.border} bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md`}
              >
                <div className="flex items-start justify-between border-b border-border-subtle pb-4">
                  <div className="flex items-start gap-3">
                    <span className={`grid h-14 w-14 place-items-center rounded-full ${a.bg} text-[20px] font-bold text-white`}>
                      {member.initial}
                    </span>
                    <div>
                      <h2 className="text-[15px] font-bold text-text-primary">{member.name}</h2>
                      <span className="mt-1 inline-flex rounded-full bg-brand-gold/15 px-2 py-0.5 text-[11px] font-bold text-brand-gold">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                  <UsersRound className={`h-5 w-5 ${a.text}`} />
                </div>
                <p className="mt-4 text-[13px] text-text-secondary">Total Agents</p>
                <p className={`mt-1 text-[28px] font-bold ${a.text}`}>{member.agents}</p>
                <Link
                  href={`/${unit}/dashboard`}
                  className={`mt-3 flex items-center justify-center gap-2 rounded-lg border ${a.border} bg-white px-3 py-2.5 text-[13px] font-semibold ${a.text} transition ${a.hoverBg}`}
                >
                  <LineChart className="h-4 w-4" />
                  View Dashboard
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, a }: { label: string; value: number; icon: typeof UsersRound; a: { text: string; bg: string; bgLight: string; hex: string } }) {
  return (
    <div className={`relative rounded-xl border border-border-subtle bg-surface-raised px-5 py-4`}>
      <p className="text-[13px] text-text-secondary">{label}</p>
      <p className={`mt-2 text-[28px] font-bold ${a.text}`}>{value}</p>
      <Icon className={`absolute bottom-4 right-5 h-8 w-8 ${a.bgLight} ${a.text}`} />
    </div>
  );
}
