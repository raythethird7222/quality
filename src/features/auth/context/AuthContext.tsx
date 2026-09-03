"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import type { AuthUser } from "@/types";
import LogoutConfirmModal from "@/components/ui/logout-confirm-modal";

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  requestLogout: () => void;
  updateUser: (patch: Partial<AuthUser>) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);
const PUBLIC_PATHS = ["/login"];

function isPublicPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const pathname = usePathname();
  const loading = !hydrated;

  useEffect(() => {
    if (isPublicPath(pathname)) {
      setUser(null); // eslint-disable-line react-hooks/set-state-in-effect
      setHydrated(true);
      return;
    }

    let cancelled = false;

    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setUser(data?.user ?? null);
        setHydrated(true);
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (!event.persisted || isPublicPath(window.location.pathname)) return;

      fetch("/api/auth/me", { cache: "no-store" })
        .then((res) => {
          if (!res.ok) throw new Error("unauthenticated");
        })
        .catch(() => {
          window.location.replace("/login");
        });
    }

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      return {
        success: false,
        error: "Email and password are required",
      };
    }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password: password.trim(),
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.user) {
      return {
        success: false,
        error: data?.error ?? "Invalid email or password",
      };
    }

    setUser(data.user as AuthUser);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setLogoutOpen(false);
    void (async () => {
      try {
        const { createBrowserClient } = await import("@/lib/supabase/client");
        await createBrowserClient().auth.signOut();
      } catch {
        // ignore client signout failure, server signout still runs
      }

      await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
      window.location.replace("/login");
    })();
  }, []);

  const requestLogout = useCallback(() => {
    setLogoutOpen(true);
  }, []);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, requestLogout, updateUser }}>
      {children}
      <LogoutConfirmModal
        open={logoutOpen}
        onConfirm={logout}
        onCancel={() => setLogoutOpen(false)}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
