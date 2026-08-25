"use client";

// AppShell: composes the persistent layout (sidebar, header, content, chatbot).
import { useState } from "react";
import GlobalHeader from "./Header";
import Sidebar from "./Sidebar";
import GlobalChatbot from "./GlobalChatbot";

// Provides the responsive shell with a togglable sidebar and the global chatbot.
export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  // Tracks whether the mobile sidebar is currently open.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Persistent sidebar; closes itself via onClose when a link/backdrop is tapped. */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header exposes a menu button that opens the sidebar on mobile. */}
        <GlobalHeader onMenuClick={() => setSidebarOpen(true)} />
        {/* Routed page content scrolls within the main area. */}
        <main className="flex-1 overflow-y-auto">{children}</main>
        <GlobalChatbot />
      </div>
    </>
  );
}
