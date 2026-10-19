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
  CREATE: "bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  UPDATE: "bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  DELETE: "bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#000000] border border-[#000000] dark:border-[#FFFFFF]",
  APPROVE: "bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  DISPATCH: "bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  LOGIN: "bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  USER_REGISTERED: "bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Security &amp; Operation Audit Logs
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Immutable ledger of all state mutations, financial approvals, user logins, and data transactions
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
          <input
            type="text"
            placeholder="Search by user, action, entity, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] shadow-xs transition-colors"
          />
        </div>

        {/* Audit logs table */}
        <div className="glass-card border border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-[#888888] dark:text-[#888888]">
              <Loader2 size={24} className="animate-spin text-[#666666] dark:text-[#A3A3A3]" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-[#000000] dark:text-[#FFFFFF]">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-[#888888] dark:text-[#888888]">
              <ShieldCheck size={32} className="mx-auto mb-2 opacity-40 text-[#666666] dark:text-[#A3A3A3]" />
              <p className="text-sm">
                {search ? "No audit entries match your search." : "No audit entries recorded yet."}
              </p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
                <tr>
                  <th className="text-left text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Timestamp</th>
                  <th className="text-left text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Actor &amp; Role</th>
                  <th className="text-left text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Action</th>
                  <th className="text-left text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Entity Affected</th>
                  <th className="text-left text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Entity Ref</th>
                  <th className="text-left text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">IP Address</th>
                  <th className="text-right text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030] dark:divide-[#303030]">
                {filtered.map((l) => (
                  <tr key={l._id} className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] dark:hover:bg-[#1F1F1F]/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-[#666666] dark:text-[#A3A3A3] text-xs whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString("en-ET")}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[#000000] dark:text-[#FFFFFF] font-medium text-xs">{l.userName || "System"}</p>
                      <p className="text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3] text-[11px]">{l.userRole || "Service"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${ACTION_COLORS[l.action] || "bg-[#E5E5E5] dark:bg-[#303030] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF]"}`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF] text-xs font-medium">{l.entity}</td>
                    <td className="px-4 py-3 font-mono text-[#666666] dark:text-[#A3A3A3] text-xs">{l.entityId || "--"}</td>
                    <td className="px-4 py-3 font-mono text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3] text-xs">{l.ipAddress || "Internal"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:text-[#FFFFFF] text-xs font-mono inline-flex items-center gap-1 font-semibold"
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
            <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] pb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">Audit Log Payload</h2>
                  <p className="text-[#666666] dark:text-[#A3A3A3] text-xs font-mono">{selectedLog._id}</p>
                </div>
                <button onClick={() => setSelectedLog(null)} className="text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors">✕</button>
              </div>

              <div className="bg-[#FAFAFA] dark:bg-[#111111] rounded-xl p-4 font-mono text-xs text-[#000000] dark:text-[#FFFFFF] overflow-x-auto max-h-96 border border-[#D4D4D4] dark:border-[#303030]">
                <pre>{JSON.stringify({ previous: selectedLog.previousValue, new: selectedLog.newValue }, null, 2)}</pre>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-xs"
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

