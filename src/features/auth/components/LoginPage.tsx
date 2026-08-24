"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { createBrowserClient } from "@/lib/supabase/client";

type Decoration =
  | {
      type: "circle";
      className: string;
      color: "brand-indigo" | "brand-gold";
      opacity: string;
    }
  | {
      type: "dots";
      className: string;
      color: "brand-gold";
      opacity: string;
      columns: number;
      count: number;
    }
  | {
      type: "line";
      className: string;
      color: "brand-gold";
    };

const COLOR_BG: Record<Decoration["color"], string> = {
  "brand-indigo": "bg-brand-indigo",
  "brand-gold": "bg-brand-gold",
};

const GRID_COLUMNS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  7: "grid-cols-7",
  8: "grid-cols-8",
  9: "grid-cols-9",
  10: "grid-cols-10",
  11: "grid-cols-11",
  12: "grid-cols-12",
};

const DECORATIONS: Decoration[] = [
  {
    type: "circle",
    className: "-left-32 -top-32 w-[620px] h-[620px]",
    color: "brand-indigo",
    opacity: "opacity-10",
  },
  {
    type: "circle",
    className: "-right-32 -bottom-40 w-[500px] h-[500px] rotate-45",
    color: "brand-gold",
    opacity: "opacity-20",
  },
  {
    type: "dots",
    className: "top-20 right-16",
    color: "brand-gold",
    opacity: "opacity-60",
    columns: 6,
    count: 36,
  },
  {
    type: "dots",
    className: "bottom-20 left-16",
    color: "brand-gold",
    opacity: "opacity-50",
    columns: 6,
    count: 36,
  },
  {
    type: "line",
    className: "right-0 top-1/2 w-[400px] h-px rotate-[-35deg]",
    color: "brand-gold",
  },
];

function BackgroundDecorations() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {DECORATIONS.map((decoration, index) => {
        if (decoration.type === "circle") {
          return (
            <div
              key={index}
              className={`absolute rounded-full ${decoration.className} ${COLOR_BG[decoration.color]} ${decoration.opacity}`}
            />
          );
        }

        if (decoration.type === "dots") {
          return (
            <div
              key={index}
              className={`absolute grid ${GRID_COLUMNS[decoration.columns] ?? GRID_COLUMNS[6]} gap-4 ${decoration.className} ${decoration.opacity}`}
            >
              {Array.from({ length: decoration.count }).map((_, dotIndex) => (
                <span
                  key={dotIndex}
                  className={`w-1.5 h-1.5 rounded-full ${COLOR_BG[decoration.color]}`}
                />
              ))}
            </div>
          );
        }

        return (
          <div
            key={index}
            className={`absolute ${decoration.className} ${COLOR_BG[decoration.color]}`}
          />
        );
      })}
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Browsers may restore this page from the back/forward cache after login,
  // bypassing the middleware redirect. Re-check the session on restore: an
  // authenticated user must never land back on the login page.
  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (!event.persisted) return;
      fetch("/api/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            window.location.replace("/dashboard");
          } else {
            setSubmitting(false);
            setError("");
          }
        })
        .catch(() => setSubmitting(false));
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // Surface errors returned in the URL (e.g. after a failed Google sign-in
  // where the email isn't registered), then clean the param so a refresh
  // doesn't re-show it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError) {
      setError(urlError);
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("error");
      window.history.replaceState({}, "", cleanUrl.toString());
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    const result = await login(username, password);
    if (result.success) {
      setError("");
      window.location.href = "/dashboard"; // eslint-disable-line @next/next/no-location-assign-relative-destination -- Full page reload for auth state
    } else {
      setSubmitting(false);
      setError(result.error ?? "Login failed");
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setGoogleLoading(true);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setGoogleLoading(false);
        setError(error.message);
      }
    } catch {
      setGoogleLoading(false);
      setError("Unable to start Google sign-in. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorations */}
      <BackgroundDecorations />

      {/* Login Container */}
      <div className="relative z-10 w-full max-w-[900px] bg-card rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.15)] overflow-hidden border border-border flex flex-col md:flex-row min-h-[560px]">

        {/* LEFT BRAND PANEL */}
        <section className="relative md:w-[42%] bg-brand-indigo text-white overflow-hidden flex flex-col justify-center px-10 py-10">

          {/* Decorative shapes */}
          <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full border-[60px] border-white/5" />

          <div className="absolute bottom-[-100px] left-[-100px] w-80 h-80 rounded-full border-[70px] border-white/5" />

          <div className="absolute inset-0 opacity-[0.06]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(30deg, transparent 45%, currentColor 46%, transparent 47%)",
                backgroundSize: "35px 35px",
              }}
            />
          </div>

          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 border-4 border-white rounded-full" />

                <div className="absolute left-6 top-1 w-2 h-12 bg-brand-gold rotate-[35deg]" />

                <div className="absolute left-2 top-7 w-5 h-2 bg-white rotate-45 rounded-full" />
              </div>

              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  QA<span className="text-brand-gold">-</span>REY
                </h1>
              </div>
            </div>

            <div className="w-14 h-1 bg-brand-gold mb-4" />

            <h2 className="text-xl font-semibold mb-2">
              Quality Assurance System
            </h2>

            <p className="text-white/75 text-base leading-relaxed max-w-sm">
              Ensuring quality.
              <br />
              Driving excellence.
            </p>

            {/* Bottom Info */}
            <div className="mt-12 flex items-center gap-3 text-white/70">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                ✓
              </div>

              <span className="text-sm">
                Reliable • Efficient • Quality Driven
              </span>
            </div>
          </div>

          {/* Gold diagonal */}
          <div className="absolute bottom-0 right-[-35px] w-20 h-[180px] bg-brand-gold rotate-[38deg]" />
        </section>

        {/* RIGHT LOGIN PANEL */}
        <section className="md:w-[58%] px-8 sm:px-14 py-8 flex flex-col justify-center">

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-brand-indigo text-white border-4 border-brand-gold flex items-center justify-center shadow-lg">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M12 3l7 3v5c0 4.5-3 7.8-7 10-4-2.2-7-5.5-7-10V6l7-3z" />
                <path d="M8.5 12l2.2 2.2 4.8-5" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Welcome Back!
            </h2>

            <p className="text-muted-foreground mt-1.5 text-sm">
              Please log in to your account
            </p>

            {error && (
              <p className="text-destructive text-sm mt-2 font-medium">{error}</p>
            )}
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleLogin}>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email / Username
              </label>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c.5-4 3-6 8-6s7.5 2 8 6" />
                  </svg>
                </div>

                <input
                  type="text"
                  placeholder="Enter your email or username"
                  value={username}
                  disabled={submitting}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  className="w-full h-11 pl-11 pr-4 rounded-lg border border-border bg-card text-foreground text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-brand-indigo focus:ring-3 focus:ring-brand-indigo/10 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 018 0v3" />
                  </svg>
                </div>

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  disabled={submitting}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="w-full h-11 pl-11 pr-11 rounded-lg border border-border bg-card text-foreground text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-brand-indigo focus:ring-3 focus:ring-brand-indigo/10 disabled:cursor-not-allowed disabled:opacity-70"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-indigo"
                >
                  {showPassword ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                      <path d="M9.9 4.2A10.8 10.8 0 0112 4c5 0 8.5 4 9.5 8a11.8 11.8 0 01-3.1 5.1" />
                      <path d="M6.2 6.2A12 12 0 002.5 12c1 4 4.5 8 9.5 8 1.4 0 2.7-.3 3.9-.8" />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-lg bg-brand-indigo text-white font-semibold tracking-wide shadow-md hover:bg-brand-indigo/90 hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  LOGGING IN...
                </>
              ) : (
                <>
                  LOG IN

                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || submitting}
            className="w-full h-11 rounded-lg border border-border bg-card text-foreground text-sm font-semibold flex items-center justify-center gap-3 shadow-sm transition-all hover:bg-surface-overlay hover:border-border-accent disabled:cursor-not-allowed disabled:opacity-70"
            aria-label="Continue with Google"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            {googleLoading ? "Redirecting to Google..." : "Continue with Google"}
          </button>
        </section>
      </div>

      {/* Footer */}
      <div className="absolute bottom-5 text-sm text-muted-foreground">
        © 2026{" "}
        <span className="font-semibold text-brand-indigo">QA-REY</span>.
        All rights reserved.
      </div>
    </main>
  );
}
