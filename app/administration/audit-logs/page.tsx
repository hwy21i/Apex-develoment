"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Search, ShieldCheck, Eye, Loader2,
} from "lucide-react";

interface AuditLogEntry {
  _id: string;
  userName?: string;
  userRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-500/20 text-green-400 border border-green-500/30",
  UPDATE: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  DELETE: "bg-red-500/20 text-red-400 border border-red-500/30",
  APPROVE: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  DISPATCH: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  LOGIN: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
  USER_REGISTERED: "bg-green-500/20 text-green-400 border border-green-500/30",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchLogs() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/audit-logs?limit=100", { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || json.error || "Failed to load audit logs");
        }
        setLogs(json.data || []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load audit logs");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchLogs();
    return () => { cancelled = true; };
  }, []);

  const filtered = logs.filter(
    (l) =>
      (l.userName || "").toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.entity.toLowerCase().includes(search.toLowerCase()) ||
      (l.entityId || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1E22] dark:text-[#D4D8DD] tracking-tight">
              Security &amp; Operation Audit Logs
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7078] dark:text-[#AAB7B7] mt-1">
              Immutable ledger of all state mutations, financial approvals, user logins, and data transactions
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAB7B7]" />
          <input
            type="text"
            placeholder="Search by user, action, entity, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#1A2D42]/80 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] placeholder-slate-400 dark:placeholder-[#AAB7B7]/50 focus:outline-none focus:border-[#C0C8CA] shadow-xs transition-colors"
          />
        </div>

        {/* Audit logs table */}
        <div className="glass-card border border-slate-200 dark:border-[#AAB7B7]/20 rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 size={24} className="animate-spin text-[#C0C8CA]" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-rose-500">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ShieldCheck size={32} className="mx-auto mb-2 opacity-40 text-[#C0C8CA]" />
              <p className="text-sm">
                {search ? "No audit entries match your search." : "No audit entries recorded yet."}
              </p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-[#1A2D42]/90 border-b border-slate-200 dark:border-[#AAB7B7]/20">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider px-4 py-3">Timestamp</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider px-4 py-3">Actor &amp; Role</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider px-4 py-3">Action</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider px-4 py-3">Entity Affected</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider px-4 py-3">Entity Ref</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider px-4 py-3">IP Address</th>
                  <th className="text-right text-xs font-semibold text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider px-4 py-3">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#AAB7B7]/15">
                {filtered.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50 dark:hover:bg-[#2E4156]/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-500 dark:text-[#AAB7B7] text-xs whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString("en-ET")}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-900 dark:text-[#D4D8DD] font-medium text-xs">{l.userName || "System"}</p>
                      <p className="text-slate-400 dark:text-[#AAB7B7] text-[11px]">{l.userRole || "Service"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${ACTION_COLORS[l.action] || "bg-slate-200 dark:bg-[#2E4156] text-slate-700 dark:text-[#D4D8DD]"}`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-800 dark:text-[#D4D8DD] text-xs font-medium">{l.entity}</td>
                    <td className="px-4 py-3 font-mono text-[#C0C8CA] text-xs">{l.entityId || "--"}</td>
                    <td className="px-4 py-3 font-mono text-slate-400 dark:text-[#AAB7B7] text-xs">{l.ipAddress || "Internal"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="text-[#C0C8CA] hover:text-white text-xs font-mono inline-flex items-center gap-1 font-semibold"
                      >
                        <Eye size={14} /> JSON
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>

        {/* JSON Inspector modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#AAB7B7]/20 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-[#D4D8DD]">Audit Log Payload</h2>
                  <p className="text-[#AAB7B7] text-xs font-mono">{selectedLog._id}</p>
                </div>
                <button onClick={() => setSelectedLog(null)} className="text-[#AAB7B7] hover:text-white transition-colors">✕</button>
              </div>

              <div className="bg-slate-900 dark:bg-[#0F1A26] rounded-xl p-4 font-mono text-xs text-[#A8C5B5] overflow-x-auto max-h-96 border border-[#AAB7B7]/20">
                <pre>{JSON.stringify({ previous: selectedLog.previousValue, new: selectedLog.newValue }, null, 2)}</pre>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="bg-[#C0C8CA] hover:bg-white text-[#1A2D42] font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

