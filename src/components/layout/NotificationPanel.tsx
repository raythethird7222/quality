"use client";

// NotificationPanel: dropdown notification center for the header.
// Uses a portal so it escapes overflow clipping and stays above other UI.

import { createPortal } from "react-dom";
import { Bell, X, CheckCheck } from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  description?: string;
  time: string;
  read: boolean;
};

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "New evaluation assigned",
    description: "You have a new evaluation for Agent A.",
    time: "2 min ago",
    read: false,
  },
  {
    id: "2",
    title: "Score threshold crossed",
    description: "Agent B dropped below 90% this week.",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "3",
    title: "Weekly report ready",
    description: "Your weekly QA summary is now available.",
    time: "Yesterday",
    read: true,
  },
  {
    id: "4",
    title: "New agent onboarded",
    description: "Agent C has been added to RM account.",
    time: "2 days ago",
    read: true,
  },
];

export default function NotificationPanel({
  open,
  onClose,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  if (!open || !triggerRef.current) return null;

  const rect = triggerRef.current.getBoundingClientRect();

  return createPortal(
    <div
      className="fixed w-80 max-h-[420px] overflow-hidden rounded-xl border border-border-default bg-card shadow-xl"
      style={{
        top: `${rect.bottom + 8}px`,
        right: `${window.innerWidth - rect.right}px`,
        zIndex: 9999,
      }}
    >
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">Notifications</p>
          <p className="text-[11px] text-text-muted">
            {SAMPLE_NOTIFICATIONS.filter((n) => !n.read).length} unread
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notifications"
          className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-overlay hover:text-text-primary"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="max-h-[340px] overflow-y-auto">
        {SAMPLE_NOTIFICATIONS.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Bell className="mb-2 h-8 w-8 text-text-muted" aria-hidden="true" />
            <p className="text-sm text-text-secondary">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {SAMPLE_NOTIFICATIONS.map((notification) => (
              <div
                key={notification.id}
                className={`flex gap-3 px-4 py-3 transition-colors hover:bg-surface-raised ${
                  notification.read ? "opacity-70" : ""
                }`}
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-raised">
                  <Bell
                    className={`h-4 w-4 ${
                      notification.read
                        ? "text-text-muted"
                        : "text-[var(--app-accent)]"
                    }`}
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[13px] font-medium ${
                      notification.read
                        ? "text-text-secondary"
                        : "text-text-primary"
                    }`}
                  >
                    {notification.title}
                  </p>
                  {notification.description && (
                    <p className="mt-0.5 text-xs text-text-muted">
                      {notification.description}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-text-muted">
                    {notification.time}
                  </p>
                </div>
                {!notification.read && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--app-accent)]" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border-subtle px-4 py-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--app-accent)] transition-colors hover:opacity-80"
        >
          <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Mark all as read
        </button>
      </div>
    </div>,
    document.body
  );
}
