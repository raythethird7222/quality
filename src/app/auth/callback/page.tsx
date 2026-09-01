"use client";

// Page: handles the Google OAuth redirect callback, exchanging the code for a session and signing in.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading";

// Client page that processes the OAuth callback flow and routes the user to the dashboard or login.
export default function AuthCallback() {
  const router = useRouter();
  // Tracks the human-readable status message shown during the callback.
  const [status, setStatus] = useState("Signing you in with Google...");

  // Runs the OAuth exchange and backend sign-in when the component mounts.
  useEffect(() => {
    // Create a browser Supabase client for the OAuth exchange.
    const supabase = createBrowserClient();
    // Guards against state updates after the component unmounts.
    let cancelled = false;

    (async () => {
      // Read the OAuth code and any provider-supplied error from the query string.
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const providerError = params.get("error_description") ?? params.get("error");

      // Redirect to login if the OAuth provider returned no authorization code.
      if (!code) {
        router.replace(
          "/login?error=" +
            encodeURIComponent(
              providerError ?? "Google authentication failed. Please try again."
            )
        );
        return;
      }

      // Exchange the authorization code for a Supabase session.
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      // Abort if the component already unmounted during the async flow.
      if (cancelled) return;

      // Redirect to login if the session exchange failed or lacks an email.
      if (error || !data.session?.user.email) {
        router.replace(
          "/login?error=" +
            encodeURIComponent(
              error?.message ?? "Google authentication failed. Please try again."
            )
        );
        return;
      }

      const email = data.session.user.email;

      try {
        // Call our backend to authenticate the user by their Google email.
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const result = await res.json();

        // Abort if the component unmounted while awaiting the backend call.
        if (cancelled) return;

        // Show the error and redirect to login when backend auth fails.
        if (!res.ok || !result.success) {
          setStatus(
            result.error ?? "Account not found. Please contact your administrator."
          );
          router.replace(
            "/login?error=" +
              encodeURIComponent(
                result.error ?? "Account not found. Please contact your administrator."
              )
          );
          return;
        }

        // On success, send the user to the dashboard.
        router.replace("/dashboard");
      } catch {
        // Abort if unmounted; otherwise redirect to login on network/auth error.
        if (cancelled) return;
        router.replace(
          "/login?error=" +
            encodeURIComponent("Authentication error. Please try again.")
        );
      }
    })();

    // Cleanup: mark the flow cancelled to prevent late state updates.
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Renders the spinner and current status message while the callback resolves.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-base">
      {/* Loading screen displayed while the OAuth callback completes */}
      <LoadingSpinner size="lg" className="text-brand-gold" />
      <p className="text-sm font-medium tracking-[0.16em] text-text-muted uppercase">
        {status}
      </p>
    </main>
  );
}
