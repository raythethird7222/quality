"use client";

// Modern QA login page inspired by the provided CTNP-style corporate direction.
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";

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
    const result = await login(username, password);

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
        {/* Large abstract circle adds the reference design's curved visual language. */}
        <div className="absolute -left-48 -top-48 h-[620px] w-[620px] rounded-full border-[90px] border-[#2F6798]/30" />
        {/* Gold arc provides the restrained premium accent. */}
        <div className="absolute -bottom-56 -right-44 h-[600px] w-[600px] rounded-full border-[70px] border-[#C8A54B]/90" />
        {/* Japanese-inspired wave pattern adds subtle visual texture without external assets. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[48%] opacity-[0.10]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 50% 100%, transparent 0 45%, #FFFFFF 46% 47%, transparent 48%)",
            backgroundSize: "54px 34px",
          }}
        />
        {/* Soft overlay keeps decorative elements subordinate to the message. */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#132B43]/20 via-transparent to-[#0B1C2D]/55" />

        {/* Brand content stays above the decorative layers. */}
        <div className="relative z-10 p-12 xl:p-16">
          {/* Small corporate eyebrow mirrors the reference's restrained typography. */}
          <p className="mb-16 text-[11px] font-medium uppercase tracking-[0.42em] text-white/65">
            People &nbsp;|&nbsp; Process &nbsp;|&nbsp; A Better Tomorrow
          </p>

          {/* Main quality statement establishes the product's purpose immediately. */}
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-[#C8A54B]">
              Quality drives
            </p>
            <h1 className="text-5xl font-semibold leading-[0.98] tracking-[-0.035em] xl:text-7xl">
              Better
              <br />
              Customer
              <br />
              Experiences
            </h1>
            <div className="my-8 h-px w-16 bg-[#C8A54B]" />
            <p className="max-w-lg text-lg leading-8 text-white/72 xl:text-xl">
              Empowering better customer experiences through smarter quality management.
            </p>
          </div>
        </div>

        {/* Brand footer highlights the platform's operational values. */}
        <div className="relative z-10 px-12 pb-10 xl:px-16 xl:pb-12">
          {/* Value row reinforces people, operational excellence, and improvement. */}
          <div className="mb-12 grid max-w-3xl grid-cols-3 gap-8">
            <div className="border-l border-white/20 pl-4">
              <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-white/55">People</p>
              <p className="text-sm font-medium">People First</p>
            </div>
            <div className="border-l border-white/20 pl-4">
              <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-white/55">Process</p>
              <p className="text-sm font-medium">Operational Excellence</p>
            </div>
            <div className="border-l border-[#C8A54B] pl-4">
              <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-[#C8A54B]">Purpose</p>
              <p className="text-sm font-medium">A Better Tomorrow</p>
            </div>
          </div>

          {/* Product statement anchors the brand panel at the bottom. */}
          <div className="flex items-center justify-between border-t border-white/10 pt-5 text-[10px] uppercase tracking-[0.3em] text-white/45">
            <span>QA Tool</span>
            <span>Quality · Precision · Excellence</span>
          </div>
        </div>
      </section>

      {/* Login panel remains bright, spacious, and focused on authentication. */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12 sm:px-10">
        {/* Mobile-only decorative circle keeps the visual identity consistent on smaller screens. */}
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full border-[48px] border-[#C8A54B]/15 lg:hidden" />
        {/* Mobile-only indigo arc balances the login composition. */}
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full border-[42px] border-[#2F6798]/10 lg:hidden" />

        {/* Login content is constrained for comfortable reading and form interaction. */}
        <div className="relative z-10 w-full max-w-[430px]">
          {/* Product mark gives the form a strong identity without relying on an external asset. */}
          <div className="mb-14 flex items-center justify-center lg:justify-start">
            <div className="relative mr-3 h-12 w-12">
              {/* QA ring represents quality and continuity. */}
              <div className="absolute inset-0 rounded-full border-[7px] border-[#173B5D]" />
              {/* Gold slash creates the distinctive brand accent. */}
              <div className="absolute left-[19px] top-[-2px] h-12 w-[6px] rotate-[34deg] bg-[#C8A54B]" />
              {/* Small cut-out accent gives the mark a custom silhouette. */}
              <div className="absolute bottom-1 left-0 h-2.5 w-5 rotate-45 rounded-full bg-[#173B5D]" />
            </div>
            <div>
              <p className="text-[30px] font-semibold leading-none tracking-[-0.04em] text-[#173B5D]">
                QA<span className="text-[#C8A54B]"> </span>TOOL
              </p>
              <p className="mt-1 text-[8px] uppercase tracking-[0.42em] text-[#687585]">
                Quality · People · Progress
              </p>
            </div>
          </div>

          {/* Login heading introduces the action clearly. */}
          <div className="mb-8">
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
                Employee ID or Email
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
                  placeholder="Enter your employee ID or email"
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
                <input type="checkbox" className="h-4 w-4 rounded border-[#C9D0D8] accent-[#2F6798]" />
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
            {/* Google mark remains recognizable while the control follows the new UI. */}
            <span className="grid h-5 w-5 place-items-center rounded-sm font-bold text-[#4285F4]" aria-hidden="true">G</span>
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
