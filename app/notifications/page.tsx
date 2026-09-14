"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Bell, CheckCircle, Clock, AlertTriangle, Info,
  Check, Trash2, Filter, ChevronRight
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "Approval" | "Warning" | "Delivery" | "Payment" | "Safety";
  timeAgo: string;
  read: boolean;
  project?: string;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "Material Request Pending Approval",
    message: "Abebe Kebede submitted MR-2024-001 for 500 bags of Portland Cement (ETB 1,350,000.00).",
    type: "Approval",
    timeAgo: "25 minutes ago",
    read: false,
    project: "Addis Heights Tower",
  },
  {
    id: "n2",
    title: "Incoming Delivery Scheduled",
    message: "Tekle Steel Works confirmed dispatch of 20 tons Rebar for tomorrow morning 08:30 AM.",
    type: "Delivery",
    timeAgo: "2 hours ago",
    read: false,
    project: "Bole Business Park",
  },
  {
    id: "n3",
    title: "Interim Payment Certificate (IPC-04) Cleared",
    message: "Commercial Bank of Ethiopia confirmed receipt of ETB 10,625,000.00 from Zemen Real Estate.",
    type: "Payment",
    timeAgo: "5 hours ago",
    read: true,
    project: "Addis Heights Tower",
  },
  {
    id: "n4",
    title: "Budget Variance Alert: Earthwork Exceeded",
    message: "Earthwork & Grading budget for Ring Road Expansion has exceeded 105% allocation.",
    type: "Warning",
    timeAgo: "1 day ago",
    read: true,
    project: "Ring Road Expansion",
  },
  {
    id: "n5",
    title: "Mandatory Safety Toolbox Talk Scheduled",
    message: "Toolbox talk on working at heights & harness inspection scheduled for Monday 07:00 AM.",
    type: "Safety",
    timeAgo: "2 days ago",
    read: true,
    project: "All Sites",
  },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Approval: <Clock size={16} className="text-yellow-400" />,
  Warning: <AlertTriangle size={16} className="text-red-400" />,
  Delivery: <CheckCircle size={16} className="text-blue-400" />,
  Payment: <CheckCircle size={16} className="text-green-400" />,
  Safety: <Info size={16} className="text-purple-400" />,
};

export default function NotificationsCenterPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<"All" | "Unread">("All");

  const filtered = notifications.filter((n) => filter === "All" || !n.read);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotif = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications & Alerts</h1>
            <p className="text-gray-400 text-sm mt-1">
              Real-time activity feed, purchase requisitions, cost alerts, and delivery notices
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                <Check size={14} />
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("All")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === "All"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white border border-gray-700"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("Unread")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === "Unread"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white border border-gray-700"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications list */}
        <div className="space-y-3">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`border rounded-xl p-4 transition-colors flex items-start justify-between gap-4 ${
                !n.read
                  ? "bg-gray-800/90 border-blue-500/40"
                  : "bg-gray-800/40 border-gray-700/60"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-900 rounded-lg mt-0.5">
                  {TYPE_ICONS[n.type]}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-bold ${!n.read ? "text-white" : "text-gray-300"}`}>
                      {n.title}
                    </h3>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                    )}
                    {n.project && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-gray-700 text-gray-300 font-medium">
                        {n.project}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 max-w-2xl">{n.message}</p>
                  <p className="text-[11px] text-gray-500">{n.timeAgo}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotif(n.id)}
                  className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                  title="Dismiss notification"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center text-gray-400">
              <Bell size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No notifications found.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

