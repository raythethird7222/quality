"use client";

import { useEffect, useRef, useState } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAccentHex } from "@/features/settings/useAccent";

function getAvatarSvg(hex: string) {
  const fill = hex.replace("#", "%23");
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23E8E7E5'><rect width='100' height='100'/><text x='50%' y='55%' font-family='sans-serif' font-size='32' font-weight='bold' fill='${fill}' dominant-baseline='middle' text-anchor='middle'>QA</text></svg>`;
}

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const accentHex = useAccentHex();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Hydration-safe mount detection
  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect -- Standard hydration pattern
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [open]);

  if (!mounted || !user || pathname === "/login") return null;

  return (
    <header className="border-b border-border bg-surface-base/80 backdrop-blur">
      <nav className="navbar mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3.5 md:px-10">
        {/* Left: Brand */}
        <div className="nav_branding flex items-center">
          <span className="text-lg font-bold tracking-tight text-text-primary">
            QA<span className="text-brand-gold">-</span>REY
          </span>
        </div>

        {/* Right: User controls */}
        <div className="flex items-center gap-2.5 md:gap-3">
          <ThemeToggle />
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label={`Profile menu for ${user.employee_name ?? ""}`}
              className={`flex items-center gap-2 rounded-md border bg-surface-raised px-1.5 py-1.5 text-text-primary transition-colors hover:bg-surface-overlay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-accent sm:px-2 ${open ? "border-border-accent bg-surface-overlay" : "border-border-default"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- SVG data URI avatar or stored profile photo */}
              <img
                className="h-9 w-9 rounded-full"
                src={user?.avatar_url ?? getAvatarSvg(accentHex)}
                alt="QA Avatar Element"
              />
              <span
                className="hidden max-w-[160px] truncate text-sm font-medium text-text-primary sm:inline"
                suppressHydrationWarning
              >
                {user?.employee_name ?? ""}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 overflow-hidden rounded-lg border border-border-default bg-card py-1.5 shadow-lg"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    router.push("/settings");
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-medium text-text-primary transition-colors hover:bg-surface-overlay focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border-accent"
                >
                  <User className="h-4 w-4 text-text-muted" aria-hidden="true" />
                  Profile
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    router.push("/settings");
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-medium text-text-primary transition-colors hover:bg-surface-overlay focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border-accent"
                >
                  <Settings
                    className="h-4 w-4 text-text-muted"
                    aria-hidden="true"
                  />
                  Settings
                </button>
                <div
                  className="my-1.5 border-t border-border-subtle"
                  role="separator"
                />
                <button
                  role="menuitem"
                  onClick={logout}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-semibold text-brand-crimson transition-colors hover:bg-brand-crimson/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-crimson"
                >
                  <LogOut
                    className="h-4 w-4 text-brand-crimson"
                    aria-hidden="true"
                  />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}