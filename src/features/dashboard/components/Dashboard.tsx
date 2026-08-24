"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Upload,
  Zap,
} from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ACCOUNTS, getAccentColors } from "@/features/accounts/config";
import AvatarCropModal from "@/components/ui/avatar-crop-modal";
import type {
  AccountKey,
  AccountAssignment,
  UserRole,
} from "@/types";

type AccountLink = {
  label: string;
  description: string;
  href: string;
  icon: typeof Zap;
  accent: string;
  borderClass: string;
  fillClass: string;
  colorClass: string;
  hoverClass: string;
};

const MANAGER_ROLES: UserRole[] = [
  "account_manager",
  "qa_supervisor",
  "quality_coordinator",
];

function getAccountsForUser(
  accounts: AccountAssignment[],
  role: UserRole
): AccountLink[] {
  const allAccounts: AccountAssignment[] = (Object.keys(
    ACCOUNTS
  ) as AccountKey[]).map((accountKey) => ({
    account: ACCOUNTS[accountKey].label,
    account_name: ACCOUNTS[accountKey].label,
    role,
    role_name: role,
  }));

  const list =
    role === "admin" || role === "qa_supervisor" ? allAccounts : accounts;

  if (list.length === 0) return [];

  const useManagerDashboard = MANAGER_ROLES.includes(role);

  return list.map((assignment) => {
    const accountKey = assignment.account.toLowerCase() as AccountKey;
    const config = ACCOUNTS[accountKey];
    const colors = getAccentColors("gold");
    return {
      label: config.label,
      description: `${config.label} Operations`,
      href: useManagerDashboard
        ? `/accounts/${accountKey}`
        : `/accounts/${accountKey}/dashboard`,
      icon: Zap,
      accent: "gold",
      borderClass: colors.border,
      fillClass: colors.bgLight,
      colorClass: colors.text,
      hoverClass: colors.hoverBg,
    };
  });
}

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarImage, setAvatarImage] = useState<string | null>(
    user?.avatar_url ?? null
  );
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect -- Standard hydration pattern
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const lastAccessedLabel = `Last accessed ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;

  const name = user?.employee_name ?? "Operator";
  const initials = name
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const accounts = user
    ? getAccountsForUser(user.accounts ?? [], user.role)
    : [];

  const displayedAvatar = avatarImage ?? user?.avatar_url ?? null;

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    event.target.value = "";
  };

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

  return (
    <main className="min-h-full bg-surface-base px-6 py-5 text-text-primary md:px-9">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-[32px] font-bold leading-none tracking-tight sm:text-[36px]">
              Welcome Back, {name}
            </h1>
            <p className="mt-2 text-[13px] leading-5 text-text-secondary">
              Select an operational managed tracking account system footprint
              to initialize dashboard views.
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
                onClick={() => fileInputRef.current?.click()}
                className="group relative grid h-[118px] w-[118px] shrink-0 place-items-center rounded-full border-2 border-brand-gold bg-surface-raised outline outline-2 outline-offset-[8px] outline-dashed outline-brand-gold/90"
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
                  <span className="text-[42px] font-medium text-brand-charcoal transition group-hover:opacity-0">
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
                <p className="mt-3 text-[15px] font-medium text-brand-indigo">
                  QA ID: {user?.employee_id ?? "--"}
                </p>
                <p className="mt-7 text-[15px] text-brand-indigo">
                  {user?.employee_email ?? "--"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5 border-brand-gold md:min-w-[330px] md:border-l-2 md:py-7 md:pl-8">
              <span className="grid h-[60px] w-[60px] place-items-center rounded-xl bg-brand-gold text-white">
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

        <section className="mt-7" aria-labelledby="accounts-heading">
          <h2
            id="accounts-heading"
            className="border-l-[7px] border-brand-gold pl-2 text-[26px] font-semibold leading-8 text-text-primary"
          >
            Allocated Dynamic Control Accounts
          </h2>
          {accounts.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-border-default bg-card px-6 py-12 text-center shadow-sm">
              <p className="text-[15px] font-semibold text-text-primary">
                No accounts allocated
              </p>
              <p className="mt-1 text-[13px] text-text-secondary">
                Managed tracking account footprints will appear here once
                assigned.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-4">
              {accounts.map((account) => (
                <AccountCard key={account.label} account={account} />
              ))}
            </div>
          )}
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

function AccountCard({ account }: { account: AccountLink }) {
  return (
    <Link
      href={account.href}
      aria-label={`Open ${account.label} dashboard`}
      className={`group relative flex h-[205px] flex-col items-center rounded-2xl border bg-card px-7 pt-4 shadow-sm transition hover:-translate-y-1 hover:text-white hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 ${account.borderClass} ${account.colorClass} ${account.hoverClass}`}
    >
      <account.icon
        className="h-[54px] w-[54px] stroke-[2.4] transition group-hover:text-white"
        aria-hidden="true"
      />
      <span
        className={`mt-3 h-1 w-full rounded-full transition group-hover:bg-white ${account.fillClass}`}
      />
      <span className="mt-3 text-[44px] font-bold leading-none tracking-tight text-text-primary transition group-hover:text-white">
        {account.label}
      </span>
      <span className="mt-1 text-[16px] text-text-secondary transition group-hover:text-white">
        {account.description}
      </span>
      <span
        className={`absolute bottom-3 right-4 grid h-7 w-7 place-items-center rounded-full text-white transition group-hover:scale-110 ${account.fillClass}`}
      >
        <ArrowRight className="h-4 w-4 stroke-[3]" />
      </span>
    </Link>
  );
}
