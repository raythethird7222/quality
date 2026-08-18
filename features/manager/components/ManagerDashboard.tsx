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

export default function ManagerDashboard({ account, agents, qaCount, members, accent }: ManagerDashboardProps) {
  return (
    <main className="min-h-screen bg-white px-6 py-7 text-[#20242b] md:px-10">
      <div className="mx-auto max-w-[1440px]">
        <nav className="flex items-center gap-7" aria-label="Breadcrumb">
          <Link href="/" className="inline-flex items-center gap-3 rounded-lg border px-4 py-2 text-[15px] font-semibold text-brand-indigo transition hover:bg-brand-indigo hover:text-white" style={{ borderColor: accent }}>
            <ArrowLeft className="h-5 w-5" />
            Return back
          </Link>
          <div className="flex items-center gap-4 text-[16px]">
            <Link href="/" className="transition hover:text-brand-indigo">Home</Link>
            <span style={{ color: accent }}>/</span>
            <span className="font-medium text-brand-indigo">{account}</span>
          </div>
        </nav>

        <section className="mt-6 min-h-[500px] rounded-[15px] border border-[#e0e5ea] bg-white px-8 py-8 shadow-[0_8px_18px_rgba(24,37,52,0.12)] md:px-9">
          <div className="flex flex-col justify-between gap-8 border-b border-[#e5c87c] pb-4 lg:flex-row">
            <div>
              <h1 className="text-[29px] font-bold tracking-tight">Manager Dashboard</h1>
              <p className="mt-3 text-[18px] text-brand-indigo">QA Team Overview</p>
            </div>

            <div className="w-full max-w-[412px]">
              <div className="grid grid-cols-2 gap-5">
                <StatCard label="Total Agents" value={agents} icon={UsersRound} accent={accent} />
                <StatCard label="Total QAs" value={qaCount} icon={ShieldCheck} accent={accent} />
              </div>
              <Link href={`/${account.toLowerCase()}/analytics`} className="ml-auto mt-3 flex items-center justify-center gap-3 rounded-lg border border-brand-indigo px-3 py-2.5 text-[15px] font-semibold text-brand-indigo transition hover:bg-brand-indigo hover:text-white">
                <BarChart3 className="h-5 w-5" />
                Manager Analytics
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-5">
            {members.map((member) => (
              <article key={member.name} className="w-[254px] rounded-[14px] border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md" style={{ borderColor: accent }}>
                <div className="flex items-start justify-between border-b border-[#d8dce1] pb-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-indigo text-[20px] font-bold text-white">{member.initial}</span>
                    <div>
                      <h2 className="text-[16px] font-bold">{member.name}</h2>
                      <span className="mt-1 inline-flex rounded-full bg-[#f8e7b8] px-2 py-0.5 text-[12px] font-bold text-[#bd8707]">ACTIVE</span>
                    </div>
                  </div>
                  <UsersRound className="h-5 w-5 text-brand-indigo" />
                </div>
                <p className="mt-4 text-[14px]">Total Agents</p>
                <p className="mt-1 text-[30px] font-bold" style={{ color: accent }}>{member.agents}</p>
                <Link href={`/${account.toLowerCase()}/dashboard`} className="mt-3 flex items-center justify-center gap-3 rounded-lg border border-brand-indigo px-3 py-2.5 text-[15px] font-semibold text-brand-indigo transition hover:bg-brand-indigo hover:text-white">
                  <LineChart className="h-5 w-5" />
                  View Dashboard
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: typeof UsersRound; accent: string }) {
  return (
    <div className="relative h-[100px] rounded-[13px] border border-[#a7c7e4] px-5 py-4">
      <p className="text-[15px]">{label}</p>
      <p className="mt-2 text-[32px] font-bold" style={{ color: accent }}>{value}</p>
      <Icon className="absolute bottom-4 right-5 h-9 w-9 text-[#a7c7e4]" />
    </div>
  );
}
