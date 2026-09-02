"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Settings,
  X,
  Menu,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";
import { ACCOUNTS } from "@/features/accounts/config";
import { getInitials, cn } from "@/lib/utils";
import { useAccent, useAccentHex, useThemeDesign } from "@/features/settings/useAccent";
import { useTheme } from "@/components/ui/ThemeProvider";
import type { AccountKey, UserRole } from "@/types";

// ============================================================
// TYPES
// ============================================================

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
};

// ============================================================
// ROLES
// ============================================================

const ALL_ROLES: UserRole[] = [
  "admin",
  "quality_coordinator",
  "account_manager",
  "qa",
  "qa_supervisor",
  "team_lead",
  "agent",
];

const MANAGER_ROLES: UserRole[] = [
  "account_manager",
  "qa_supervisor",
  "quality_coordinator",
];

// ============================================================
// TOP NAVIGATION
// ============================================================

const TOP_NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ALL_ROLES,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    roles: ALL_ROLES,
  },
];

// ============================================================
// SIDEBAR
// ============================================================

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user, requestLogout } = useAuth();
  const { resolvedTheme } = useTheme();
  const accent = useAccent();
  const accentHex = useAccentHex();
  const themeDesign = useThemeDesign();

  // Determine if the accent color is dark (needs a light logo) or light (needs
  // a dark logo). Computes relative luminance from the resolved accent hex.
  const isDarkAccent = (() => {
    const hex = accentHex.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    // Relative luminance (sRGB approximation).
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance < 0.5;
  })();

  // Use the dark-mode logo when the sidebar background is a dark color,
  // except for Classic and Midnight which use the original logo.
  const useDarkLogo = isDarkAccent && themeDesign !== "classic" && themeDesign !== "midnight";

  const [collapsed, setCollapsed] = useState(false);

  if (!user || pathname === "/login") return null;

  const role = user.role;

  // ============================================================
  // ACCOUNT ACCESS
  // ============================================================

  const isManager =
    MANAGER_ROLES.includes(role) || role === "admin";

  const accounts: {
    key: AccountKey;
    label: string;
    href: string;
  }[] = isManager
      ? (Object.keys(ACCOUNTS) as AccountKey[]).map((key) => ({
        key,
        label: ACCOUNTS[key].label,
        href: `/accounts/${key}`,
      }))
      : (user.accounts ?? []).map((assignment) => {
        const key =
          assignment.account.toLowerCase() as AccountKey;

        return {
          key,
          label: assignment.account,
          href: `/accounts/${key}/dashboard`,
        };
      });

  const topItems = TOP_NAV.filter((item) =>
    item.roles.includes(role)
  );

  // ============================================================
  // ACTIVE STATE
  // ============================================================

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href));

  const isAccountActive = (key: AccountKey) =>
    pathname.startsWith(`/accounts/${key}`);

  // ============================================================
  // USER
  // ============================================================

  const initials = getInitials(
    user.employee_name ?? "QA"
  );

  // ============================================================
  // ACCOUNT INITIALS
  // ============================================================

  const getAccountInitials = (label: string) => {
    const clean = label.trim();

    // Prefer first two characters for account names such as RM,
    // JS, BF, etc.
    return clean.slice(0, 3).toUpperCase();
  };

  // ============================================================
  // ACTIONS
  // ============================================================

  const handleLogout = () => {
    onClose();
    requestLogout();
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      {/* ======================================================
          MOBILE BACKDROP
      ====================================================== */}

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/20 transition-all duration-300 ease-in-out md:static md:translate-x-0",
          collapsed ? "w-20" : "w-64",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          backgroundColor: "var(--app-accent)",
        }}
        aria-label="Primary navigation"
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          className={cn(
            "relative flex h-20 shrink-0 items-center border-b border-white/20",
            collapsed
              ? "justify-center px-2"
              : "justify-between px-3"
          )}
        >
          {/* LOGO — LEFT */}

          {!collapsed && (
            <div className="relative">
              <img
                src={useDarkLogo ? "/logo_dark_mode.png" : "/logo.png"}
                alt="QA-REY Logo"
                className="h-24 w-24 object-contain"
              />
              <span className="absolute inset-x-0 left-auto right-0 top-4 z-10 w-fit rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow">
                Beta
              </span>
            </div>
          )}

          {/* BURGER — RIGHT */}

          <button
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            title={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--app-accent-contrast)] transition-colors hover:bg-white/10",
              collapsed
                ? "md:flex"
                : "ml-auto"
            )}
          >
            {collapsed ? (
              <Menu className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* MOBILE CLOSE */}

          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="absolute right-3 flex h-9 w-9 items-center justify-center rounded-md text-[var(--app-accent-contrast)] transition-colors hover:bg-white/10 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ==================================================
            NAVIGATION
        ================================================== */}

        <nav
          className={cn(
            "flex-1 overflow-y-auto py-4",
            collapsed ? "px-2" : "px-3"
          )}
        >
          {/* ==================================================
              MAIN NAV
          ================================================== */}

          <div className="space-y-1">
            {topItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  aria-current={
                    active ? "page" : undefined
                  }
                  title={
                    collapsed
                      ? item.label
                      : undefined
                  }
                  className={cn(
                    "flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors",
                    collapsed
                      ? "justify-center px-2"
                      : "gap-3 px-3",
                    active
                      ? "opacity-100"
                      : "text-[var(--app-accent-contrast)] opacity-80 hover:bg-white/10 hover:opacity-100"
                  )}
                  style={
                    active
                      ? {
                        backgroundColor:
                          "var(--app-accent-contrast)",
                        color:
                          "var(--app-accent)",
                      }
                      : undefined
                  }
                >
                  <Icon
                    className="h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />

                  {!collapsed && (
                    <span>{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* ==================================================
              ACCOUNTS
          ================================================== */}

          {accounts.length > 0 && (
            <div className="mt-6 space-y-1">
              {/* SECTION TITLE */}

              {!collapsed && (
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--app-accent-contrast)] opacity-70">
                  Accounts
                </p>
              )}

              {/* ACCOUNT LINKS */}

              {/* ACCOUNT LINKS */}

              {accounts.map((account) => {
                const active = isAccountActive(account.key);

                const accountInitials =
                  getAccountInitials(account.label);

                return (
                  <Link
                    key={account.key}
                    href={account.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? account.label : undefined}
                    className={cn(
                      "flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors",
                      collapsed
                        ? "justify-center px-2"
                        : "ml-3 px-3",
                      active
                        ? "opacity-100"
                        : "text-[var(--app-accent-contrast)] opacity-80 hover:bg-white/10 hover:opacity-100"
                    )}
                    style={
                      active
                        ? {
                          backgroundColor:
                            "var(--app-accent-contrast)",
                          color: "var(--app-accent)",
                        }
                        : undefined
                    }
                  >
                    {/* COLLAPSED: SHOW INITIALS */}
                    {collapsed && (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold">
                        {accountInitials}
                      </span>
                    )}

                    {/* EXPANDED: SHOW ACCOUNT NAME ONLY */}
                    {!collapsed && (
                      <span className="truncate">
                        {account.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* ==================================================
            USER FOOTER
        ================================================== */}

        {!collapsed && (
          <div className="shrink-0">
            <div className="">
              <img
                src="https://zhdmsmwrskxowvytedgh.supabase.co/storage/v1/object/public/Images/design%20(1).png"
                alt=""
                className="w-full rounded-lg object-contain"
              />
            </div>
          </div>
        )}

        <div
          className={cn(
            "shrink-0 border-t border-white/20 p-3",
            collapsed && "px-2"
          )}
        >
          <div
            className={cn(
              "flex items-center rounded-lg py-2",
              collapsed
                ? "flex-col gap-3"
                : "gap-3 px-3"
            )}
          >
            {/* AVATAR */}

            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="h-9 w-9 shrink-0 rounded-full object-cover"
                src={user.avatar_url}
                alt="User Avatar"
              />
            ) : (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-[13px] font-bold text-[var(--app-accent-contrast)]">
                {initials}
              </span>
            )}

            {/* USER INFO */}

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--app-accent-contrast)]">
                  {user.employee_name ?? ""}
                </p>

                <p className="truncate text-xs text-[var(--app-accent-contrast)] opacity-70">
                  {user.role_name ?? ""}
                </p>
              </div>
            )}

            {/* LOGOUT */}

            <button
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--app-accent-contrast)] opacity-70 transition-colors hover:bg-white/10 hover:opacity-100"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}