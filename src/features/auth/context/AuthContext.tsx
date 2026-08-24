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
import { createBrowserClient } from "@/lib/supabase/client";

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
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
  const pathname = usePathname();
  const loading = !hydrated;

  useEffect(() => {
    if (isPublicPath(pathname)) {
      setUser(null); // eslint-disable-line react-hooks/set-state-in-effect -- Standard hydration pattern
      setHydrated(true);
      return;
    }

    let cancelled = false;

    fetch("/api/auth/me")
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

  // Protected pages can be restored from the back/forward cache after logout
  // without any server round-trip. Revalidate the session on restore so a
  // stale authenticated view is never shown.
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

  const login = useCallback(
    async (email: string, password: string) => {
      if (!email.trim() || !password.trim()) {
        return {
          success: false,
          error: "Email and employee ID are required",
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

      const data = await res.json();

      if (!data.success || !data.user) {
        return {
          success: false,
          error: data.error ?? "Invalid email or employee ID",
        };
      }

      const authUser: AuthUser = data.user;
      setUser(authUser);
      return { success: true };
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    void fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      const supabase = createBrowserClient();
      void supabase.auth.signOut().catch(() => {});
      window.location.href = "/login"; // eslint-disable-line @next/next/no-location-assign-relative-destination -- Full page reload for auth state
    });
  }, []);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
