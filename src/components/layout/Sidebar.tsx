"use client";

// Sidebar: primary navigation with top-level links and per-account entries.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Settings, X } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ACCOUNTS } from "@/features/accounts/config";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { AccountKey, UserRole } from "@/types";

// Shape of a navigation entry, including the roles allowed to see it.
type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
};

// Every role in the system; used to gate the always-available top-level links.
const ALL_ROLES: UserRole[] = [
  "admin",
  "quality_coordinator",
  "account_manager",
  "qa",
  "qa_supervisor",
  "team_lead",
  "agent",
];

// Top-level navigation shown for every authenticated role.
const TOP_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ALL_ROLES },
  { href: "/settings", label: "Settings", icon: Settings, roles: ALL_ROLES },
];

const MANAGER_ROLES: UserRole[] = [
  "account_manager",
  "qa_supervisor",
  "quality_coordinator",
];

// Renders the responsive sidebar with role-aware links and account list.
export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user || pathname === "/login") return null;

  const role = user.role;
  // Managers and admins see all accounts; others see only their assignments.
  const isManager = MANAGER_ROLES.includes(role) || role === "admin";

  // Builds the account list: all accounts for managers, assigned ones for agents.
  const accounts: { key: AccountKey; label: string; href: string }[] = isManager
    ? (Object.keys(ACCOUNTS) as AccountKey[]).map((key) => ({
        key,
        label: ACCOUNTS[key].label,
        href: `/accounts/${key}`,
      }))
    : (user.accounts ?? []).map((assignment) => {
        const key = assignment.account.toLowerCase() as AccountKey;
        return {
          key,
          label: assignment.account,
          href: `/accounts/${key}/dashboard`,
        };
      });

  // Filters top-level nav down to items permitted for the current role.
  const topItems = TOP_NAV.filter((item) => item.roles.includes(role));

  // Determines whether a top-level link matches the current route.
  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href));

  // Determines whether an account link matches the current route.
  const isAccountActive = (key: AccountKey) =>
    pathname.startsWith(`/accounts/${key}`);

  // Initials shown in the avatar fallback when no photo is present.
  const initials = getInitials(user.employee_name ?? "QA");

  return (
    <>
      {open && (
        // Mobile backdrop that closes the sidebar when tapped.
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/20 transition-transform duration-200 md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ backgroundColor: "var(--app-accent)" }}
        aria-label="Primary navigation"
      >
        <div className="flex h-20 items-center justify-end border-b border-white/20 px-5">
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-white/10 text-[var(--app-accent-contrast)] transition-colors hover:bg-white/20 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {/* Top-level navigation links (Dashboard, Settings). */}
          <div className="space-y-1">
            {topItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "opacity-100"
                      : "text-[var(--app-accent-contrast)] opacity-80 hover:bg-white/10 hover:opacity-100"
                  )}
                  style={
                    active
                      ? { backgroundColor: "var(--app-accent-contrast)", color: "var(--app-accent)" }
                      : undefined
                  }
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {accounts.length > 0 && (
            // Per-account navigation group.
            <div className="space-y-1">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--app-accent-contrast)] opacity-70">
                Accounts
              </p>
              {accounts.map((account) => {
                const active = isAccountActive(account.key);
                return (
                  <Link
                    key={account.key}
                    href={account.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "ml-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "opacity-100"
                        : "text-[var(--app-accent-contrast)] opacity-80 hover:bg-white/10 hover:opacity-100"
                    )}
                    style={
                      active
                        ? { backgroundColor: "var(--app-accent-contrast)", color: "var(--app-accent)" }
                        : undefined
                    }
                  >
                    <span className="truncate">{account.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Footer profile strip with avatar, name/role, and logout. */}
        <div className="border-t border-white/20 p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- Stored profile photo
              <img
                className="h-9 w-9 rounded-full object-cover"
                src={user.avatar_url}
                alt="QA Avatar Element"
              />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-[13px] font-bold text-[var(--app-accent-contrast)]">
                {initials}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--app-accent-contrast)]">
                {user?.employee_name ?? ""}
              </p>
              <p className="truncate text-xs text-[var(--app-accent-contrast)] opacity-70">
                {user?.role_name ?? ""}
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              aria-label="Logout"
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
