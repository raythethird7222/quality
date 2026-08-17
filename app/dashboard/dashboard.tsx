"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Activity, Users, Radio, Upload } from "lucide-react";

const accounts = [
  { label: "JS", icon: Zap },
  { label: "DFT", icon: Activity },
  { label: "RM", icon: Users },
  { label: "BF", icon: Radio },
];

export default function Dashboard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-screen w-full bg-[#020d1b] text-[#F8F8F6]">
      <div className="mx-auto max-w-[1400px]">
        <main className="px-6 py-10 md:px-10">
          <div className="mx-auto max-w-[900px] rounded-[22px] border border-[#1a2f4e] bg-[#081a2b] px-6 py-8 shadow-[0_22px_60px_rgba(2,13,27,0.7)]">
            <h1 className="text-[2.2rem] font-semibold tracking-tight text-[#F8F8F6] md:text-[2.7rem]">
              Welcome Back, Operator
            </h1>
            <p className="mt-2 text-base text-[#dfe8f3]/80">
              Select an operational managed tracking account system footprint to initialize dashboard views
            </p>

            <div className="mt-8 rounded-[16px] border border-[#2F6798]/40 bg-[#071827] px-5 py-6">
              <div className="flex items-center gap-5">
                {/* Avatar upload button with image preview */}
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="group relative flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border-[3px] border-[#2F6798] bg-[#0c2137] transition hover:border-[#7dd3fc] hover:shadow-[0_0_16px_rgba(127,228,255,0.3)]"
                  aria-label="Upload avatar image"
                >
                  {/* Upload icon overlay on hover */}
                  <div className="absolute inset-1 rounded-full border border-dashed border-[#7dd3fc]/90 flex items-center justify-center bg-black/0 transition group-hover:bg-black/40">
                    <Upload className="h-6 w-6 text-[#7dd3fc] opacity-0 transition group-hover:opacity-100" />
                  </div>

                  {/* Image preview or default initials */}
                  {avatarImage ? (
                    <img
                      src={avatarImage}
                      alt="User avatar"
                      className="relative z-10 h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="relative z-10 text-2xl font-bold tracking-tight text-[#7dd3fc] transition group-hover:opacity-0">QA</span>
                  )}
                </button>

                {/* Hidden file input for image selection */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-hidden="true"
                />

                {/* User profile information */}
                <div className="leading-tight">
                  <div className="text-[2rem] font-bold tracking-tight text-[#F8F8F6]">QAS RAY</div>
                  <div className="mt-1 text-sm text-[#dfe8f3]/75">QA ID: 1108</div>
                  <div className="mt-2 text-sm text-[#dfe8f3]/75">ralasagas.telenet@gmail.com</div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-6 w-1.5 rounded-full bg-[#2F6798]" />
                <h2 className="text-[1.2rem] font-bold tracking-[0.12em] text-[#F8F8F6] uppercase md:text-[1.45rem]">
                  Allocated Dynamic Control Accounts
                </h2>
              </div>

              <div className="grid max-w-[720px] grid-cols-2 gap-4 md:grid-cols-4">
                {accounts.map((account, index) => {
                  const IconComponent = account.icon;
                  const iconColor = index % 2 === 0 ? "#7dd3fc" : "#C8A54B";
                  return (
                    <button
                      key={account.label}
                      onClick={() => router.push(`/${account.label.toLowerCase()}`)}
                      className="flex h-[150px] flex-col items-center justify-center rounded-[14px] border border-[#243d5b] bg-[#071827] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition cursor-pointer hover:scale-105 hover:border-[#7dd3fc] hover:bg-[#0a2540] hover:shadow-[0_0_20px_rgba(127,228,255,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]"
                    >
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-[#061421]">
                        {/* Lucide React icon with alternating brand colors */}
                        <IconComponent size={32} color={iconColor} strokeWidth={2} />
                      </div>
                      <span className="text-[1.05rem] font-semibold tracking-[0.06em] text-[#F8F8F6] uppercase">
                        {account.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
