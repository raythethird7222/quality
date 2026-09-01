"use client";

// Page: the settings screen, guarded by authentication and delegating to the SettingsView component.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import SettingsView from "@/features/settings/components/SettingsView";

// Client page that redirects unauthenticated users and renders the settings UI once loaded.
export default function SettingsPage() {
  // Consume auth context to know the current user and loading state.
  const { user, loading } = useAuth();
  // Provides navigation for redirects.
  const router = useRouter();

  // Redirects to login if the user is not authenticated once auth state resolves.
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // While unauthenticated, show a minimal loading placeholder.
  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[14px] text-text-secondary">Loading settings…</p>
      </div>
    );
  }

  // Render the settings UI once a user is confirmed.
  return <SettingsView />;
}
