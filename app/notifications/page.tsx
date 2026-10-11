"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import {
  Bell, Clock, AlertTriangle, Info,
  Check, Package, Receipt, Wrench, CalendarClock,
  ShieldAlert, Loader2, CheckCheck,
} from "lucide-react";

type NotificationType =
  | "MATERIAL_REQUEST"
  | "PO_APPROVAL"
  | "LOW_STOCK"
  | "INVOICE_OVERDUE"
  | "TASK_ASSIGNED"
  | "PROJECT_DELAY"
  | "SAFETY_ALERT"
  | "SYSTEM";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_META: Record<NotificationType, { label: string; icon: React.ReactNode }> = {
  MATERIAL_REQUEST: { label: "Material Request", icon: <Package size={16} className="text-[#C0C8CA]" /> },
  PO_APPROVAL: { label: "PO Approval", icon: <Clock size={16} className="text-amber-500" /> },
  LOW_STOCK: { label: "Low Stock", icon: <AlertTriangle size={16} className="text-rose-500" /> },
  INVOICE_OVERDUE: { label: "Invoice Overdue", icon: <Receipt size={16} className="text-orange-500" /> },
  TASK_ASSIGNED: { label: "Task Assigned", icon: <Wrench size={16} className="text-sky-400" /> },
  PROJECT_DELAY: { label: "Project Delay", icon: <CalendarClock size={16} className="text-rose-500" /> },
  SAFETY_ALERT: { label: "Safety Alert", icon: <ShieldAlert size={16} className="text-purple-400" /> },
  SYSTEM: { label: "System", icon: <Info size={16} className="text-[#AAB7B7]" /> },
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-ET");
}

export default function NotificationsCenterPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"All" | "Unread">("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/notifications?limit=50", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.error || "Failed to load notifications");
      }
      setNotifications(json.data.notifications || []);
      setUnreadCount(json.data.unreadCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = notifications.filter((n) => filter === "All" || !n.isRead);

  const markAllAsRead = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      if (res.ok) await load();
    } finally {
      setBusy(false);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    if (!res.ok) await load();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#C0C8CA] font-mono text-xs font-bold uppercase tracking-wider mb-1">
              <Bell className="w-4 h-4" /> Real-time Activity Feed
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1E22] dark:text-[#D4D8DD] tracking-tight">
              Notifications &amp; Alerts
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7078] dark:text-[#AAB7B7] mt-1">
              Purchase requisitions, cost alerts, delivery notices, and site critical events
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#1A2D42] hover:bg-slate-100 dark:hover:bg-[#2E4156] text-slate-800 dark:text-[#D4D8DD] border border-slate-200 dark:border-[#AAB7B7]/25 text-xs font-semibold transition-all hover:scale-[1.015] active:scale-[0.98] shadow-xs disabled:opacity-50"
              >
                <CheckCheck size={14} className="text-[#C0C8CA]" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("All")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === "All"
                ? "bg-[#C0C8CA] text-[#1A2D42] shadow-sm font-extrabold"
                : "bg-white dark:bg-[#1A2D42]/80 text-slate-600 dark:text-[#AAB7B7] hover:text-slate-900 dark:hover:text-[#D4D8DD] border border-slate-200 dark:border-[#AAB7B7]/25"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("Unread")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === "Unread"
                ? "bg-[#C0C8CA] text-[#1A2D42] shadow-sm font-extrabold"
                : "bg-white dark:bg-[#1A2D42]/80 text-slate-600 dark:text-[#AAB7B7] hover:text-slate-900 dark:hover:text-[#D4D8DD] border border-slate-200 dark:border-[#AAB7B7]/25"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications list */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={24} className="animate-spin text-[#C0C8CA]" />
          </div>
        ) : error ? (
          <div className="glass-card border border-rose-500/30 rounded-2xl p-6 text-center">
            <p className="text-sm text-rose-500">{error}</p>
            <button
              onClick={() => { setLoading(true); load(); }}
              className="mt-3 text-xs font-semibold text-[#C0C8CA] hover:underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.SYSTEM;
              const inner = (
                <>
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-slate-100 dark:bg-[#1A2D42] rounded-xl border border-slate-200 dark:border-[#AAB7B7]/25 shrink-0">
                      {meta.icon}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-xs sm:text-sm font-bold ${!n.isRead ? "text-slate-900 dark:text-[#D4D8DD]" : "text-slate-600 dark:text-[#AAB7B7]"}`}>
                          {n.title}
                        </h3>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#C0C8CA] inline-block shrink-0" />
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#2E4156] text-slate-600 dark:text-[#D4D8DD] font-semibold border border-slate-200 dark:border-[#AAB7B7]/25">
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-[#D4D8DD]/90 max-w-2xl leading-relaxed">{n.message}</p>
                      <p className="text-[11px] text-[#AAB7B7] font-mono">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>

                  {!n.isRead && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); markAsRead(n._id); }}
                      className="p-1.5 text-[#AAB7B7] hover:text-[#C0C8CA] hover:bg-slate-100 dark:hover:bg-[#2E4156] rounded-lg transition-colors self-start shrink-0"
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </>
              );

              const cardClasses = `glass-card border rounded-2xl p-4 transition-all hover:scale-[1.005] flex items-start justify-between gap-4 ${
                !n.isRead
                  ? "border-[#C0C8CA]/50 shadow-xs bg-white dark:bg-[#2E4156]/35"
                  : "border-slate-200 dark:border-[#AAB7B7]/20 opacity-85 bg-white dark:bg-[#1A2D42]/40"
              }`;

              return n.link ? (
                <Link key={n._id} href={n.link} className={`${cardClasses} hover:border-[#C0C8CA]`}>
                  {inner}
                </Link>
              ) : (
                <div key={n._id} className={cardClasses}>
                  {inner}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="glass-card border border-slate-200 dark:border-[#AAB7B7]/20 rounded-2xl p-12 text-center text-slate-400">
                <Bell size={32} className="mx-auto mb-2 opacity-40 text-[#C0C8CA]" />
                <p className="text-sm">
                  {filter === "Unread" ? "No unread notifications." : "No notifications yet."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
