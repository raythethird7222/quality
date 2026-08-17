"use client";

import { ArrowLeft, BarChart3, LineChart, Users } from "lucide-react";
import Link from "next/link";

export default function DFTManagerDashboard() {
  return (
    <div className="h-screen bg-[#020d1b] text-[#F8F8F6]">
      <div className="mx-auto max-w-[1400px]">
        {/* Navigation section */}
        <div className="border-b border-[#1a2f4e] px-6 py-6 md:px-10">
          {/* Return back button */}
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 rounded-lg border border-[#243d5b] bg-[#071827] px-4 py-2 text-sm font-medium text-[#7dd3fc] transition hover:border-[#7dd3fc] hover:bg-[#0a2540]"
          >
            <ArrowLeft size={18} />
            Return back
          </Link>

          {/* Breadcrumb navigation */}
          <div className="flex items-center gap-2 text-sm text-[#dfe8f3]/75">
            <Link href="/" className="hover:text-[#7dd3fc] transition">
              Home
            </Link>
            <span>/</span>
            <span className="text-[#7dd3fc]">DFT</span>
          </div>
        </div>

        {/* Main content */}
        <main className="px-6 py-10 md:px-10">
          <div className="grid gap-8">
            {/* Header and stats section */}
            <div className="flex flex-col justify-between gap-8 lg:flex-row">
              {/* Title section */}
              <div>
                <h1 className="text-[2.7rem] font-bold tracking-tight text-[#F8F8F6]">
                  Manager Dashboard
                </h1>
                <p className="mt-2 text-base text-[#C8A54B]">DFT Team Overview</p>
              </div>

              {/* Stats and button */}
              <div className="flex flex-col gap-4">
                {/* Stats cards */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Total Agents card */}
                  <div className="rounded-[14px] border border-[#243d5b] bg-[#071827] px-6 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-sm text-[#dfe8f3]/75">Total Agents</div>
                    <div className="mt-2 text-3xl font-bold text-[#C8A54B]">6</div>
                  </div>

                  {/* Total QAs card */}
                  <div className="rounded-[14px] border border-[#243d5b] bg-[#071827] px-6 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="text-sm text-[#dfe8f3]/75">Total QAs</div>
                    <div className="mt-2 text-3xl font-bold text-[#C8A54B]">2</div>
                  </div>
                </div>

                {/* Manager Analytics button */}
                <button className="flex items-center justify-center gap-2 rounded-[10px] border border-[#C8A54B] bg-transparent px-6 py-3 font-medium text-[#C8A54B] transition hover:bg-[#C8A54B]/10">
                  <BarChart3 size={18} />
                  Manager Analytics
                </button>
              </div>
            </div>

            {/* Team member cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Team member card 1 */}
              <div className="rounded-[16px] border border-[#243d5b] bg-[#071827] px-6 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:scale-105 hover:border-[#C8A54B] hover:bg-[#0a2540] hover:shadow-[0_0_20px_rgba(200,165,75,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C8A54B] text-[#020d1b] font-bold">
                      D
                    </div>
                    <div>
                      <h3 className="font-bold text-[#F8F8F6]">QA DIANA</h3>
                      <span className="mt-1 inline-block rounded-full bg-[#C8A54B]/20 px-2 py-1 text-xs font-semibold text-[#C8A54B] uppercase">
                        Active
                      </span>
                    </div>
                  </div>
                  <Users size={20} className="text-[#C8A54B]" />
                </div>

                <div className="mt-6">
                  <div className="text-sm text-[#dfe8f3]/75">Total Agents</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#C8A54B]">3</span>
                  </div>
                </div>

                <Link href="/dft/dashboard" className="mt-6 flex items-center justify-center gap-2 rounded-[10px] border border-[#C8A54B] bg-transparent px-4 py-2 font-medium text-[#C8A54B] transition hover:bg-[#C8A54B]/10">
                  <LineChart size={16} />
                  View Dashboard
                </Link>
              </div>

              {/* Team member card 2 */}
              <div className="rounded-[16px] border border-[#243d5b] bg-[#071827] px-6 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:scale-105 hover:border-[#C8A54B] hover:bg-[#0a2540] hover:shadow-[0_0_20px_rgba(200,165,75,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C8A54B] text-[#020d1b] font-bold">
                      F
                    </div>
                    <div>
                      <h3 className="font-bold text-[#F8F8F6]">QA FRANK</h3>
                      <span className="mt-1 inline-block rounded-full bg-[#C8A54B]/20 px-2 py-1 text-xs font-semibold text-[#C8A54B] uppercase">
                        Active
                      </span>
                    </div>
                  </div>
                  <Users size={20} className="text-[#C8A54B]" />
                </div>

                <div className="mt-6">
                  <div className="text-sm text-[#dfe8f3]/75">Total Agents</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#C8A54B]">3</span>
                  </div>
                </div>

                <Link href="/dft/dashboard" className="mt-6 flex items-center justify-center gap-2 rounded-[10px] border border-[#C8A54B] bg-transparent px-4 py-2 font-medium text-[#C8A54B] transition hover:bg-[#C8A54B]/10">
                  <LineChart size={16} />
                  View Dashboard
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
