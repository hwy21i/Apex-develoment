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
  MATERIAL_REQUEST: { label: "Material Request", icon: <Package size={16} className="text-[#666666] dark:text-[#A3A3A3]" /> },
  PO_APPROVAL: { label: "PO Approval", icon: <Clock size={16} className="text-[#000000] dark:text-[#FFFFFF]" /> },
  LOW_STOCK: { label: "Low Stock", icon: <AlertTriangle size={16} className="text-[#000000] dark:text-[#FFFFFF]" /> },
  INVOICE_OVERDUE: { label: "Invoice Overdue", icon: <Receipt size={16} className="text-[#000000] dark:text-[#FFFFFF]" /> },
  TASK_ASSIGNED: { label: "Task Assigned", icon: <Wrench size={16} className="text-[#000000] dark:text-[#FFFFFF]" /> },
  PROJECT_DELAY: { label: "Project Delay", icon: <CalendarClock size={16} className="text-[#000000] dark:text-[#FFFFFF]" /> },
  SAFETY_ALERT: { label: "Safety Alert", icon: <ShieldAlert size={16} className="text-[#000000] dark:text-[#FFFFFF]" /> },
  SYSTEM: { label: "System", icon: <Info size={16} className="text-[#666666] dark:text-[#A3A3A3]" /> },
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
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) {
        load();
      }
    });
    return () => {
      ignore = true;
    };
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
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <Bell className="w-4 h-4" /> Real-time Activity Feed
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Notifications &amp; Alerts
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Purchase requisitions, cost alerts, delivery notices, and site critical events
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#111111] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030] text-xs font-semibold transition-all hover:scale-[1.015] active:scale-[0.98] shadow-xs disabled:opacity-50"
              >
                <CheckCheck size={14} className="text-[#666666] dark:text-[#A3A3A3]" />
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
                ? "bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] shadow-sm font-extrabold"
                : "bg-white dark:bg-[#111111] text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("Unread")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === "Unread"
                ? "bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] shadow-sm font-extrabold"
                : "bg-white dark:bg-[#111111] text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications list */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#888888] dark:text-[#888888]">
            <Loader2 size={24} className="animate-spin text-[#666666] dark:text-[#A3A3A3]" />
          </div>
        ) : error ? (
          <div className="glass-card border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-6 text-center">
            <p className="text-sm text-[#000000] dark:text-[#FFFFFF]">{error}</p>
            <button
              onClick={() => { setLoading(true); load(); }}
              className="mt-3 text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] hover:underline"
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
                    <div className="p-2.5 bg-[#F5F5F5] dark:bg-[#171717] rounded-xl border border-[#D4D4D4] dark:border-[#303030] shrink-0">
                      {meta.icon}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-xs sm:text-sm font-bold ${!n.isRead ? "text-[#000000] dark:text-[#FFFFFF]" : "text-[#666666] dark:text-[#A3A3A3]"}`}>
                          {n.title}
                        </h3>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#000000] dark:bg-[#FFFFFF] inline-block shrink-0" />
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F5F5] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] font-semibold border border-[#D4D4D4] dark:border-[#303030]">
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#666666] dark:text-[#A3A3A3] max-w-2xl leading-relaxed">{n.message}</p>
                      <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3] font-mono">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>

                  {!n.isRead && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); markAsRead(n._id); }}
                      className="p-1.5 text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] rounded-lg transition-colors self-start shrink-0"
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </>
              );

              const cardClasses = `glass-card border rounded-2xl p-4 transition-all hover:scale-[1.005] flex items-start justify-between gap-4 ${
                !n.isRead
                  ? "border-[#000000] dark:border-[#FFFFFF] shadow-xs bg-white dark:bg-[#171717]"
                  : "border-[#D4D4D4] dark:border-[#303030] opacity-85 bg-white dark:bg-[#111111]"
              }`;

              return n.link ? (
                <Link key={n._id} href={n.link} className={`${cardClasses} hover:border-[#000000] dark:hover:border-[#FFFFFF]`}>
                  {inner}
                </Link>
              ) : (
                <div key={n._id} className={cardClasses}>
                  {inner}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="glass-card border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-12 text-center text-[#888888] dark:text-[#888888]">
                <Bell size={32} className="mx-auto mb-2 opacity-40 text-[#666666] dark:text-[#A3A3A3]" />
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
