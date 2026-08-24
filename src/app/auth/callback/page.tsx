"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Signing you in with Google...");

  useEffect(() => {
    const supabase = createBrowserClient();
    let cancelled = false;

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const providerError = params.get("error_description") ?? params.get("error");

      if (!code) {
        router.replace(
          "/login?error=" +
            encodeURIComponent(
              providerError ?? "Google authentication failed. Please try again."
            )
        );
        return;
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (cancelled) return;

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
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const result = await res.json();

        if (cancelled) return;

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

        router.replace("/dashboard");
      } catch {
        if (cancelled) return;
        router.replace(
          "/login?error=" +
            encodeURIComponent("Authentication error. Please try again.")
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-base">
      <LoadingSpinner size="lg" className="text-brand-gold" />
      <p className="text-sm font-medium tracking-[0.16em] text-text-muted uppercase">
        {status}
      </p>
    </main>
  );
}
