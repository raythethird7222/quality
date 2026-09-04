"use client";

import { createPortal } from "react-dom";
import { Bell, CheckCheck, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

type NotificationItem = { notification_id: number; title: string; description: string | null; read_at: string | null; created_at: string };

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function NotificationPanel({ open, onClose, employeeId, onUnreadCountChange, panelRef }: { open: boolean; onClose: () => void; employeeId: number; onUnreadCountChange: (count: number) => void; panelRef: React.RefObject<HTMLDivElement | null> }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selected, setSelected] = useState<NotificationItem | null>(null);
  const loadNotifications = useCallback(async () => {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { notifications?: NotificationItem[] };
    setNotifications(data.notifications ?? []);
  }, []);

  useEffect(() => {
    window.setTimeout(() => void loadNotifications(), 0);
    const client = createBrowserClient();
    const channel = client.channel(`notifications-${employeeId}`).on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `recipient_employee_id=eq.${employeeId}` }, () => void loadNotifications()).subscribe();
    const fallbackSync = window.setInterval(() => void loadNotifications(), 5000);
    return () => { window.clearInterval(fallbackSync); void client.removeChannel(channel); };
  }, [employeeId, loadNotifications]);

  useEffect(() => { onUnreadCountChange(notifications.filter((notification) => !notification.read_at).length); }, [notifications, onUnreadCountChange]);

  async function markRead(notificationId?: number) {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(notificationId == null ? {} : { notification_id: notificationId }) });
    setNotifications((current) => current.map((notification) => notificationId == null || notification.notification_id === notificationId ? { ...notification, read_at: new Date().toISOString() } : notification));
    if (notificationId != null) {
      const notification = notifications.find((item) => item.notification_id === notificationId);
      if (notification) setSelected({ ...notification, read_at: new Date().toISOString() });
    }
  }

  async function deleteNotification(notificationId?: number) {
    await fetch(notificationId == null ? "/api/notifications" : `/api/notifications?id=${notificationId}`, { method: "DELETE" });
    setNotifications((current) => notificationId == null ? [] : current.filter((notification) => notification.notification_id !== notificationId));
    if (notificationId == null || selected?.notification_id === notificationId) setSelected(null);
  }

  const unreadCount = notifications.filter((notification) => !notification.read_at).length;
  return createPortal(<div ref={panelRef} className={`fixed right-4 top-16 z-[9999] max-h-[460px] w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border-default bg-card shadow-xl ${open ? "" : "hidden"}`}>
    <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3"><div><p className="text-sm font-semibold text-text-primary">Notifications</p><p className="text-[11px] text-text-muted">{unreadCount} unread</p></div><div className="flex items-center gap-1"><button type="button" onClick={() => void deleteNotification()} className="rounded-md p-1.5 text-text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" aria-label="Delete all notifications" title="Delete all"><Trash2 className="h-4 w-4" /></button><button type="button" onClick={onClose} className="rounded-md p-1.5 text-text-muted hover:bg-surface-overlay hover:text-text-primary" aria-label="Close notifications"><X className="h-4 w-4" /></button></div></div>
    {selected && <div className="border-b border-border-subtle bg-surface-raised px-4 py-4"><div className="mb-2 flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Notification details</p><button type="button" onClick={() => setSelected(null)} className="text-xs font-semibold text-[var(--app-accent)]">Back</button></div><p className="text-sm font-semibold text-text-primary">{selected.title}</p><p className="mt-2 text-[13px] leading-5 text-text-secondary">{selected.description ?? "No additional details."}</p><p className="mt-2 text-[10px] text-text-muted">{formatTime(selected.created_at)}</p></div>}
    <div className="max-h-[350px] overflow-y-auto">{notifications.length === 0 ? <div className="flex flex-col items-center justify-center py-10"><Bell className="mb-2 h-8 w-8 text-text-muted" /><p className="text-sm text-text-secondary">No notifications yet</p></div> : <div className="divide-y divide-border-subtle">{notifications.map((notification) => <div key={notification.notification_id} className={`flex gap-3 px-4 py-3 transition-colors hover:bg-surface-raised ${notification.read_at ? "opacity-70" : ""}`}><button type="button" onClick={() => void markRead(notification.notification_id)} className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-raised" title="View notification" aria-label="View notification"><Bell className={`h-4 w-4 ${notification.read_at ? "text-text-muted" : "text-[var(--app-accent)]"}`} /></button><button type="button" onClick={() => void markRead(notification.notification_id)} className="min-w-0 flex-1 text-left" title="View notification"><span className="block text-[13px] font-medium text-text-primary">{notification.title}</span>{notification.description && <span className="mt-0.5 block text-xs text-text-muted">{notification.description}</span>}<span className="mt-1 block text-[10px] text-text-muted">{formatTime(notification.created_at)}</span></button>{!notification.read_at && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--app-accent)]" />}<button type="button" onClick={() => void deleteNotification(notification.notification_id)} className="mt-1 rounded p-1 text-text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" aria-label="Delete notification" title="Delete notification"><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div>}</div>
    {notifications.length > 0 && <div className="flex justify-between border-t border-border-subtle px-4 py-2"><button type="button" onClick={() => void markRead()} disabled={unreadCount === 0} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--app-accent)] disabled:cursor-not-allowed disabled:opacity-40"><CheckCheck className="h-3.5 w-3.5" />Mark all as read</button><button type="button" onClick={() => void deleteNotification()} className="text-xs font-semibold text-red-600 hover:text-red-700">Delete all</button></div>}
  </div>, document.body);
}
