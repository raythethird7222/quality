"use client";

// Authentication context: provides session state and login/logout helpers.
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

// Shape of the authentication context value exposed to consumers.
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

// Internal React context holding the auth state and actions.
const AuthContext = createContext<AuthContextType | null>(null);

// Routes that do not require an authenticated session.
const PUBLIC_PATHS = ["/login"];

// Determines whether a pathname is a public (unauthenticated) route.
function isPublicPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

// Provides authentication state and actions to the application subtree.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // The currently authenticated user, or null when signed out.
  const [user, setUser] = useState<AuthUser | null>(null);
  // Tracks whether the initial session fetch has completed (hydration).
  const [hydrated, setHydrated] = useState(false);
  const pathname = usePathname();
  // Loading is true until the session check has hydrated.
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

  // Authenticates a user via the credentials login API.
  const login = useCallback(
    async (email: string, password: string) => {
      if (!email.trim() || !password.trim()) {
        return {
          success: false,
          error: "Email and employee code are required",
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
          error: data.error ?? "Invalid email or employee code",
        };
      }

      const authUser: AuthUser = data.user;
      setUser(authUser);
      return { success: true };
    },
    []
  );

  // Clears the local session and signs the user out of Supabase.
  const logout = useCallback(() => {
    setUser(null);
    void fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      const supabase = createBrowserClient();
      void supabase.auth.signOut().catch(() => {});
      window.location.href = "/login"; // eslint-disable-line @next/next/no-location-assign-relative-destination -- Full page reload for auth state
    });
  }, []);

  // Merges a partial patch into the current authenticated user.
  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to consume the authentication context (must be within AuthProvider).
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
