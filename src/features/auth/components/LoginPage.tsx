"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/features/auth/context/AuthContext";

const TYPEWRITER_WORDS = ["Quality", "Precision", "Insights", "Excellence"];

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // URL data is not available during the server render. Read it after mount so
  // server and client render the same initial tree.
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [typewriterText, setTypewriterText] = useState("");
  const [typewriterIndex, setTypewriterIndex] = useState(0);
  const [typewriterDeleting, setTypewriterDeleting] = useState(false);

  useEffect(() => {
    const current = TYPEWRITER_WORDS[typewriterIndex % TYPEWRITER_WORDS.length];
    let timeout: ReturnType<typeof setTimeout>;

    if (!typewriterDeleting) {
      if (typewriterText !== current) {
        timeout = setTimeout(
          () => setTypewriterText(current.slice(0, typewriterText.length + 1)),
          90
        );
      } else {
        timeout = setTimeout(() => setTypewriterDeleting(true), 1700);
      }
    } else if (typewriterText.length > 0) {
      timeout = setTimeout(
        () => setTypewriterText(current.slice(0, typewriterText.length - 1)),
        55
      );
    } else {
      timeout = setTimeout(() => {
        setTypewriterDeleting(false);
        setTypewriterIndex((index) => index + 1);
      }, 300);
    }

    return () => clearTimeout(timeout);
  }, [typewriterDeleting, typewriterIndex, typewriterText]);

  useEffect(() => {
    const errorMessage = new URLSearchParams(window.location.search).get("error");
    if (!errorMessage) return;

    setError(errorMessage);
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("error");
    window.history.replaceState({}, "", cleanUrl.toString());
  }, []);

  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (!event.persisted) return;

      fetch("/api/auth/me", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (data?.user) {
            window.location.replace("/dashboard");
          } else {
            setSubmitting(false);
          }
        })
        .catch(() => setSubmitting(false));
    }

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError("");

    const result = await login(username, password);
    if (result.success) {
      window.location.href = "/dashboard";
      return;
    }

    setSubmitting(false);
    setError(result.error ?? "Unable to sign in. Please check your credentials.");
  }

  async function handleOAuthLogin() {
    setError("");
    setOauthLoading(true);

    try {
      const { createBrowserClient } = await import("@/lib/supabase/client");
      const supabase = createBrowserClient();

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) {
        setOauthLoading(false);
        setError(oauthError.message);
      }
    } catch {
      setOauthLoading(false);
      setError("Unable to start single sign-on. Please try again.");
    }
  }

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-[#F8F8F6] text-[#17283B] lg:grid lg:grid-cols-[58%_42%]">
      <section className="relative hidden h-full overflow-hidden bg-[#132B43] text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-y-0 right-0 flex items-center">
          <Image
            src="https://zhdmsmwrskxowvytedgh.supabase.co/storage/v1/object/public/Images/Herro-Photo-scaled.png"
            alt=""
            width={1971}
            height={2560}
            priority
            className="h-full w-auto object-contain opacity-[0.7]"
            sizes="58vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#132B43]/70 via-[#132B43]/35 to-[#132B43]/85" />
        <div className="absolute right-0 bottom-0 hidden lg:block">
          <div className="absolute -bottom-40 -left-44 h-[520px] w-[520px] rounded-full border-[80px] border-[#2F6798]/40" />
          <div className="absolute -bottom-28 -left-32 h-[380px] w-[380px] rounded-full border-[55px] border-[#C8A54B]/30" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center p-12 xl:p-16">
          <p className="mb-16 text-[11px] font-medium uppercase tracking-[0.42em] text-white/65">
            Insights &nbsp;|&nbsp; Intelligence &nbsp;|&nbsp; A Better Tomorrow
          </p>

          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-[#C8A54B]">
              AI-powered quality
            </p>
            <h1 className="text-5xl font-semibold leading-[0.98] tracking-[-0.035em] xl:text-7xl">
              Smarter
              <br />
              AI-driven
              <br />
              <span className="text-[#C8A54B]">
                {typewriterText}
                <span className="animate-pulse">|</span>
              </span>
            </h1>
            <div className="my-8 h-px w-16 bg-[#C8A54B]" />
            <p className="max-w-lg text-lg leading-8 text-white/72 xl:text-xl">
              Review interactions, evaluate agent performance, and improve quality standards across your team.
            </p>
          </div>
        </div>

        <div className="relative z-10 px-12 pb-10 xl:px-16 xl:pb-12">
          <div className="mb-12 grid max-w-3xl grid-cols-3 gap-8">
            <div className="border-l border-white/20 pl-4">
              <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-white/55">Insights</p>
              <p className="text-sm font-medium">Actionable Data</p>
            </div>
            <div className="border-l border-white/20 pl-4">
              <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-white/55">Intelligence</p>
              <p className="text-sm font-medium">AI-Driven Quality</p>
            </div>
            <div className="border-l border-[#C8A54B] pl-4">
              <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-[#C8A54B]">Purpose</p>
              <p className="text-sm font-medium">A Better Tomorrow</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-5 text-[10px] uppercase tracking-[0.3em] text-white/45">
            <span>QA Tool</span>
            <span>CTNP | Philippines</span>
          </div>
        </div>
      </section>

      <section className="flex h-full w-full overflow-y-auto px-6 py-10 sm:px-10 lg:overflow-hidden">
        <div className="relative z-10 flex h-full w-full flex-col justify-center">
          <div className="mb-2 flex justify-center">
            <Image src="/logo.png" alt="QA Tool logo" width={492} height={188} priority className="h-auto w-[220px]" />
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-4xl font-semibold tracking-[-0.035em] text-[#17283B]">
              Welcome back
            </h2>
            <p className="mt-3 text-base text-[#6A7583]">
              Sign in to your QA workspace.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
            >
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="qa-username" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#536172]">
                Email
              </label>
              <div className="relative">
                <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8190A0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20c.6-3.4 2.9-5.5 7-5.5s6.4 2.1 7 5.5" />
                </svg>
                <input
                  id="qa-username"
                  name="username"
                  type="email"
                  autoComplete="username"
                  value={username}
                  disabled={submitting || oauthLoading}
                  placeholder="Enter your email"
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setError("");
                  }}
                  className="h-14 w-full rounded-xl border border-[#D7DDE3] bg-white pl-12 pr-4 text-[15px] text-[#17283B] outline-none transition placeholder:text-[#9AA4AF] focus:border-[#2F6798] focus:ring-4 focus:ring-[#2F6798]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label htmlFor="qa-password" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#536172]">
                Password
              </label>
              <div className="relative">
                <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8190A0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                  <rect x="5" y="10" width="14" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 018 0v3" />
                </svg>
                <input
                  id="qa-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  disabled={submitting || oauthLoading}
                  placeholder="Enter your password"
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  className="h-14 w-full rounded-xl border border-[#D7DDE3] bg-white pl-12 pr-12 text-[15px] text-[#17283B] outline-none transition placeholder:text-[#9AA4AF] focus:border-[#2F6798] focus:ring-4 focus:ring-[#2F6798]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={submitting || oauthLoading}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8190A0] transition hover:text-[#2F6798] disabled:opacity-50"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a3 3 0 004.2 4.2" />
                      <path d="M9.9 4.7A10.7 10.7 0 0112 4.5c5 0 8.5 4.5 9.5 7.5a12.4 12.4 0 01-3.1 4.9" />
                      <path d="M6.1 6.1C4.4 7.4 3.2 9.2 2.5 12c1 3 4.5 7.5 9.5 7.5 1.4 0 2.7-.3 3.8-.8" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                      <path d="M2.5 12S6 4.5 12 4.5 21.5 12 21.5 12 18 19.5 12 19.5 2.5 12 2.5 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-1 text-sm">
              <button
                type="button"
                onClick={() => setError("Please contact your administrator if you need your password reset.")}
                className="font-medium text-[#244F78] transition hover:text-[#C8A54B]"
              >
                Need help?
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting || oauthLoading || !username.trim() || !password.trim()}
              className="group flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#244F78] px-5 text-[15px] font-semibold text-white shadow-[0_10px_25px_rgba(36,79,120,0.18)] transition hover:bg-[#173B5D] focus:outline-none focus:ring-4 focus:ring-[#2F6798]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{submitting ? "Signing in…" : "Sign In"}</span>
            </button>
          </form>

          <div className="my-7 flex items-center gap-4 text-xs uppercase tracking-[0.18em] text-[#9AA4AF]">
            <span className="h-px flex-1 bg-[#E0E4E8]" />
            <span>or</span>
            <span className="h-px flex-1 bg-[#E0E4E8]" />
          </div>

          <button
            type="button"
            disabled={submitting || oauthLoading}
            onClick={handleOAuthLogin}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-[#D7DDE3] bg-white px-5 text-[15px] font-medium text-[#26384A] transition hover:border-[#B9C3CD] hover:bg-[#FBFCFD] focus:outline-none focus:ring-4 focus:ring-[#2F6798]/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>{oauthLoading ? "Connecting…" : "Sign in with Google"}</span>
          </button>

          <p className="mt-12 text-center text-[9px] uppercase tracking-[0.34em] text-[#A2ABB5]">
            QA Tool &nbsp;|&nbsp; Internal Use Only
          </p>
        </div>
      </section>
    </main>
  );
}
