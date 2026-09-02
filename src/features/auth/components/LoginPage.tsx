"use client";

// Modern QA login page inspired by the provided CTNP-style corporate direction.
import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/features/auth/context/AuthContext";

// Words cycled through by the typewriter effect in the headline.
const TYPEWRITER_WORDS = ["Quality", "Precision", "Insights", "Excellence"];

// Login page component keeps the existing authentication flow while replacing the visual presentation.
export default function LoginPage() {
  // Reuse the application's existing credential authentication implementation.
  const { login } = useAuth();

  // Store the user's login identifier.
  const [username, setUsername] = useState("");
  // Store the user's password.
  const [password, setPassword] = useState("");
  // Toggle password visibility.
  const [showPassword, setShowPassword] = useState(false);
  // Show authentication or callback errors inline.
  const [error, setError] = useState(() =>
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("error") ?? ""
      : ""
  );
  // Disable credential controls while authentication is running.
  const [submitting, setSubmitting] = useState(false);
  // Disable the Microsoft/Google-style OAuth control while redirecting.
  const [oauthLoading, setOauthLoading] = useState(false);
  // Persist the session when the user asks to be remembered.
  const [rememberMe, setRememberMe] = useState(false);

  // Typewriter effect words for the highlighted brand term.
  const [typewriterText, setTypewriterText] = useState("");
  const [typewriterIndex, setTypewriterIndex] = useState(0);
  const [typewriterDeleting, setTypewriterDeleting] = useState(false);

  // Animates the highlighted word with a typewriter (type/delete/shift) effect.
  useEffect(() => {
    const current = TYPEWRITER_WORDS[typewriterIndex % TYPEWRITER_WORDS.length];
    let timeout: ReturnType<typeof setTimeout>;

    if (!typewriterDeleting) {
      // Keep typing the current word until it is fully shown.
      if (typewriterText !== current) {
        timeout = setTimeout(
          () => setTypewriterText(current.slice(0, typewriterText.length + 1)),
          90
        );
      } else {
        // Pause briefly, then switch to deleting.
        timeout = setTimeout(() => setTypewriterDeleting(true), 1700);
      }
    } else {
      // Delete the current word entirely, then shift to the next one.
      if (typewriterText.length > 0) {
        timeout = setTimeout(
          () => setTypewriterText(current.slice(0, typewriterText.length - 1)),
          55
        );
      } else {
        timeout = setTimeout(() => {
          setTypewriterDeleting(false);
          setTypewriterIndex((index) => index + 1);
        }, 300);
        return () => clearTimeout(timeout);
      }
    }

    return () => clearTimeout(timeout);
  }, [typewriterText, typewriterDeleting, typewriterIndex]);

  // Re-check the session when a browser restores the login page from its back/forward cache.
  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      // Only perform the session check for pages restored from the browser cache.
      if (!event.persisted) return;

      // Ask the existing auth endpoint whether a session is already active.
      fetch("/api/auth/me")
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          // Authenticated users should never remain on the login screen.
          if (data?.user) {
            window.location.replace("/dashboard");
            return;
          }

          // Restore the form to an interactive state when no session exists.
          setSubmitting(false);
          setError("");
        })
        .catch(() => setSubmitting(false));
    }

    // Register the browser cache restore listener.
    window.addEventListener("pageshow", handlePageShow);

    // Remove the listener when the component unmounts.
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // Remove callback error query parameters after their value has been copied into state.
  useEffect(() => {
    // Only manipulate browser history when a callback error is present.
    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("error")
    ) {
      // Build a clean URL without exposing the authentication error in the address bar.
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("error");
      window.history.replaceState({}, "", cleanUrl.toString());
    }
  }, []);

  // Submit credentials through the existing application authentication context.
  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    // Prevent a normal browser form submission.
    event.preventDefault();

    // Ignore duplicate submissions while authentication is running.
    if (submitting) return;

    // Enter the loading state and clear any previous error.
    setSubmitting(true);
    setError("");

    // Keep the application's existing authentication behavior unchanged.
    const result = await login(username, password, rememberMe);

    // Redirect authenticated users to the existing dashboard.
    if (result.success) {
      window.location.href = "/dashboard";
      return;
    }

    // Return the form to an interactive state when authentication fails.
    setSubmitting(false);
    setError(result.error ?? "Unable to sign in. Please check your credentials.");
  }

  // Start the existing Google OAuth flow without changing the application's auth provider configuration.
  async function handleOAuthLogin() {
    // Clear any previous error before starting the redirect.
    setError("");
    setOauthLoading(true);

    try {
      // Load the browser Supabase client only when the OAuth action is used.
      const { createBrowserClient } = await import("@/lib/supabase/client");
      const supabase = createBrowserClient();

      // Start the provider redirect using the application's existing callback route.
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      // Surface provider errors without breaking the login page.
      if (oauthError) {
        setOauthLoading(false);
        setError(oauthError.message);
      }
    } catch {
      // Surface unexpected OAuth initialization errors safely.
      setOauthLoading(false);
      setError("Unable to start single sign-on. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F8F6] text-[#17283B] lg:grid lg:grid-cols-[58%_42%]">
      {/* Brand panel creates the dark, premium corporate visual from the reference design. */}
      <section className="relative hidden min-h-screen overflow-hidden bg-[#132B43] text-white lg:flex lg:flex-col lg:justify-between">
        {/* Hero team photo blended into the dark panel. */}
        <div className="absolute inset-y-0 right-0 flex items-center">
          <Image
            src="/hero.png"
            alt=""
            width={1971}
            height={2560}
            priority
            className="h-full w-auto object-contain opacity-[0.7]"
            sizes="58vw"
          />
        </div>
        {/* Gradient wash keeps the image blended and text legible. */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#132B43]/70 via-[#132B43]/35 to-[#132B43]/85" />

        {/* Decorative design at the bottom-left corner of the panel. */}
        <div className="absolute -bottom-40 -left-44 h-[520px] w-[520px] rounded-full border-[80px] border-[#2F6798]/40" />
        <div className="absolute -bottom-28 -left-32 h-[380px] w-[380px] rounded-full border-[55px] border-[#C8A54B]/30" />

        {/* Cebu Tele-Net Philippines logo at the top-left of the panel. */}
        <div className="absolute left-12 top-12 z-10 xl:left-16 xl:top-14">
          <Image
            src="/ctnp_phi.png"
            alt="Cebu Tele-Net Philippines"
            width={300}
            height={138}
            priority
            className="h-auto w-[150px] xl:w-[170px]"
          />
        </div>

        {/* Brand content stays above the decorative layers. */}
        <div className="relative z-10 flex flex-1 flex-col justify-center p-12 xl:p-16">
          {/* Small corporate eyebrow mirrors the reference's restrained typography. */}
          <p className="mb-16 text-[11px] font-medium uppercase tracking-[0.42em] text-white/65">
            Insights &nbsp;|&nbsp; Intelligence &nbsp;|&nbsp; A Better Tomorrow
          </p>

          {/* Main quality statement establishes the product's purpose immediately. */}
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
              An AI assistant that helps you review interactions, evaluate agents, and elevate quality at scale.
            </p>
          </div>
        </div>

        {/* Brand footer highlights the platform's operational values. */}
        <div className="relative z-10 px-12 pb-10 xl:px-16 xl:pb-12">
          {/* Value row reinforces people, operational excellence, and improvement. */}
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

          {/* Product statement anchors the brand panel at the bottom. */}
          <div className="flex items-center justify-between border-t border-white/10 pt-5 text-[10px] uppercase tracking-[0.3em] text-white/45">
            <span>QA Tool</span>
            <span>CTNP | Philippines</span>
          </div>
        </div>
      </section>

      {/* Login panel remains bright, spacious, and focused on authentication. */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12 sm:px-10">

        {/* Login content is constrained for comfortable reading and form interaction. */}
        <div className="relative z-10 w-full max-w-[430px]">
          {/* CTNP logo gives the form its brand identity. */}
          <div className="mb-14 flex justify-center">
            <Image src="/logo.png" alt="QA Tool logo" width={492} height={188} priority className="h-auto w-[220px]" />
          </div>

          {/* Login heading introduces the action clearly. */}
          <div className="mb-8 text-center">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C8A54B]">
              Secure workspace
            </p>
            <h2 className="text-4xl font-semibold tracking-[-0.035em] text-[#17283B]">
              Welcome back
            </h2>
            <p className="mt-3 text-base text-[#6A7583]">
              Sign in to your QA workspace.
            </p>
          </div>

          {/* Authentication errors are presented above the fields without changing the existing auth behavior. */}
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
            >
              {error}
            </div>
          )}

          {/* Credential form uses the existing login handler. */}
          <form className="space-y-5" onSubmit={handleLogin}>
            {/* Employee/email field follows the clean reference input style. */}
            <div>
              <label htmlFor="qa-username" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#536172]">
                Email
              </label>
              <div className="relative">
                {/* User icon provides a compact visual affordance. */}
                <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8190A0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20c.6-3.4 2.9-5.5 7-5.5s6.4 2.1 7 5.5" />
                </svg>
                <input
                  id="qa-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  disabled={submitting}
                  placeholder="Enter your email"
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setError("");
                  }}
                  className="h-14 w-full rounded-xl border border-[#D7DDE3] bg-white pl-12 pr-4 text-[15px] text-[#17283B] outline-none transition placeholder:text-[#9AA4AF] focus:border-[#2F6798] focus:ring-4 focus:ring-[#2F6798]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password field includes a keyboard-accessible visibility control. */}
            <div>
              <label htmlFor="qa-password" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#536172]">
                Password
              </label>
              <div className="relative">
                {/* Lock icon identifies the sensitive credential field. */}
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
                  disabled={submitting}
                  placeholder="Enter your password"
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  className="h-14 w-full rounded-xl border border-[#D7DDE3] bg-white pl-12 pr-12 text-[15px] text-[#17283B] outline-none transition placeholder:text-[#9AA4AF] focus:border-[#2F6798] focus:ring-4 focus:ring-[#2F6798]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
                {/* Password visibility button avoids changing the existing password state. */}
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={submitting}
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

            {/* Secondary controls provide familiar enterprise login affordances. */}
            <div className="flex items-center justify-between gap-4 pt-1 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-[#536172]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-[#C9D0D8] accent-[#2F6798]"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setError("Please contact your administrator to reset your password.")}
                className="font-medium text-[#244F78] transition hover:text-[#C8A54B]"
              >
                Forgot password?
              </button>
            </div>

            {/* Primary action uses the reference's full-width premium button. */}
            <button
              type="submit"
              disabled={submitting || !username.trim() || !password}
              className="group flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#244F78] px-5 text-[15px] font-semibold text-white shadow-[0_10px_25px_rgba(36,79,120,0.18)] transition hover:bg-[#173B5D] focus:outline-none focus:ring-4 focus:ring-[#2F6798]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{submitting ? "Signing in…" : "Sign In"}</span>
              {!submitting && <span className="text-lg transition-transform group-hover:translate-x-1">→</span>}
            </button>
          </form>

          {/* Provider separator keeps the OAuth option visually secondary. */}
          <div className="my-7 flex items-center gap-4 text-xs uppercase tracking-[0.18em] text-[#9AA4AF]">
            <span className="h-px flex-1 bg-[#E0E4E8]" />
            <span>or</span>
            <span className="h-px flex-1 bg-[#E0E4E8]" />
          </div>

          {/* Existing Google OAuth is presented as the enterprise SSO action. */}
          <button
            type="button"
            disabled={submitting || oauthLoading}
            onClick={handleOAuthLogin}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-[#D7DDE3] bg-white px-5 text-[15px] font-medium text-[#26384A] transition hover:border-[#B9C3CD] hover:bg-[#FBFCFD] focus:outline-none focus:ring-4 focus:ring-[#2F6798]/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {/* Official Google "G" logo (four-color mark) for the SSO control. */}
            <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>{oauthLoading ? "Connecting…" : "Sign in with Google"}</span>
          </button>

          {/* Security note reassures users that the page is an authenticated internal workspace. */}
          <div className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-[#7D8996]">
            <svg className="h-4 w-4 text-[#2F6798]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M12 3l7 3v5c0 4.5-3 7.8-7 10-4-2.2-7-5.5-7-10V6l7-3z" />
              <path d="M8.5 12l2.2 2.2 4.8-5" />
            </svg>
            <span>Your account is protected by secure authentication.</span>
          </div>

          {/* Footer identifies this as an internal business application. */}
          <p className="mt-12 text-center text-[9px] uppercase tracking-[0.34em] text-[#A2ABB5]">
            QA Tool &nbsp;|&nbsp; Internal Use Only
          </p>
        </div>
      </section>
    </main>
  );
}
