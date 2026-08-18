"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Activity, ArrowRight, CalendarDays, Radio, Upload, Users, Zap } from "lucide-react";

const accounts = [
  { label: "JS", description: "Job Scheduler", href: "/js", icon: Zap, borderClass: "border-[#D69B16]", fillClass: "bg-[#D69B16]", colorClass: "text-[#D69B16]", hoverClass: "hover:bg-[#D69B16]" },
  { label: "DFT", description: "Data Flow Tracking", href: "/dft", icon: Activity, borderClass: "border-[#1E62A5]", fillClass: "bg-[#1E62A5]", colorClass: "text-[#1E62A5]", hoverClass: "hover:bg-[#1E62A5]" },
  { label: "RM", description: "Resource Management", href: "/rm", icon: Users, borderClass: "border-[#E31C2C]", fillClass: "bg-[#E31C2C]", colorClass: "text-[#E31C2C]", hoverClass: "hover:bg-[#E31C2C]" },
  { label: "BF", description: "Broadcast Framework", href: "/bf", icon: Radio, borderClass: "border-brand-charcoal", fillClass: "bg-brand-charcoal", colorClass: "text-brand-charcoal", hoverClass: "hover:bg-brand-charcoal" },
];

export default function Dashboard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-[#171b22] md:px-10">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-[32px] font-bold leading-none tracking-tight sm:text-[36px]">Welcome Back, Operator</h1>
            <p className="mt-2 text-[16px] leading-5 text-[#383e48]">Select an operational managed tracking account system footprint to initialize dashboard views.</p>
          </div>
        </header>

        <section className="mt-5 rounded-[10px] border border-brand-indigo border-t-4 bg-white px-6 py-5 shadow-[0_8px_20px_rgba(34,45,62,0.08)]" aria-label="Operator profile">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-8">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="group relative grid h-[118px] w-[118px] shrink-0 place-items-center rounded-full border-2 border-brand-gold bg-[#f5f2e8] outline outline-2 outline-offset-[8px] outline-dashed outline-brand-gold/90" aria-label="Upload profile photo">
                {avatarImage ? <img src={avatarImage} alt="Operator profile" className="h-[110px] w-[110px] rounded-full object-cover" /> : <span className="text-[42px] font-medium text-brand-charcoal transition group-hover:opacity-0">SD</span>}
                <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45 opacity-0 transition group-hover:opacity-100"><Upload className="h-5 w-5 text-white" /></span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <div>
                <p className="text-[38px] font-bold leading-none tracking-tight sm:text-[42px]">SYS DEV</p>
                <p className="mt-3 text-[17px] font-medium text-brand-indigo">QA ID: 1245625</p>
                <p className="mt-7 text-[17px] text-brand-indigo">blampago.telenet@gmail.com</p>
              </div>
            </div>
            <div className="flex items-center gap-5 border-brand-gold md:min-w-[330px] md:border-l-2 md:py-7 md:pl-8">
              <span className="grid h-[60px] w-[60px] place-items-center rounded-xl bg-brand-gold text-white"><CalendarDays className="h-9 w-9 stroke-[2.5]" aria-hidden="true" /></span>
              <p className="text-[17px] leading-[1.55] text-[#272b33]">Last Accessed<br />August 18, 2026 | 11:17 PM</p>
            </div>
          </div>
        </section>

        <section className="mt-7" aria-labelledby="accounts-heading">
          <h2 id="accounts-heading" className="border-l-[7px] border-brand-gold pl-2 text-[26px] font-semibold leading-8 text-[#232831]">Allocated Dynamic Control Accounts</h2>
          <div className="mt-5 flex flex-wrap gap-7">
            {accounts.map((account) => (
              <Link key={account.label} href={account.href} aria-label={`Open ${account.label} dashboard`} className={`group relative flex h-[205px] w-[260px] flex-col items-center rounded-[14px] border bg-white px-7 pt-4 transition hover:-translate-y-1 hover:text-white hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 ${account.borderClass} ${account.colorClass} ${account.hoverClass}`}>
                <account.icon className="h-[54px] w-[54px] stroke-[2.4] transition group-hover:text-white" aria-hidden="true" />
                <span className={`mt-3 h-1 w-full rounded-full transition group-hover:bg-white ${account.fillClass}`} />
                <span className="mt-3 text-[44px] font-bold leading-none tracking-tight text-black transition group-hover:text-white">{account.label}</span>
                <span className="mt-1 text-[16px] text-[#474b53] transition group-hover:text-white">{account.description}</span>
                <span className={`absolute bottom-3 right-4 grid h-7 w-7 place-items-center rounded-full text-white transition group-hover:scale-110 ${account.fillClass}`}><ArrowRight className="h-4 w-4 stroke-[3]" /></span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
