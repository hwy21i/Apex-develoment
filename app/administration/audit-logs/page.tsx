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
            <h1 className="text-2xl font-bold text-white">Security & Operation Audit Logs</h1>
            <p className="text-gray-400 text-sm mt-1">
              Immutable ledger of all state mutations, financial approvals, user logins, and data transactions
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user, action, entity, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Audit logs table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <ShieldCheck size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {search ? "No audit entries match your search." : "No audit entries recorded yet."}
              </p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Timestamp</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Actor & Role</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Action</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Entity Affected</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Entity Ref</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">IP Address</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((l) => (
                  <tr key={l._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-gray-400 text-xs whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString("en-ET")}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-xs">{l.userName || "System"}</p>
                      <p className="text-gray-400 text-[11px]">{l.userRole || "Service"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${ACTION_COLORS[l.action] || "bg-gray-700 text-white"}`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white text-xs font-medium">{l.entity}</td>
                    <td className="px-4 py-3 font-mono text-blue-400 text-xs">{l.entityId || "--"}</td>
                    <td className="px-4 py-3 font-mono text-gray-400 text-xs">{l.ipAddress || "Internal"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="text-blue-400 hover:text-blue-300 text-xs font-mono inline-flex items-center gap-1"
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
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-700 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Audit Log Payload</h2>
                  <p className="text-gray-400 text-xs font-mono">{selectedLog._id}</p>
                </div>
                <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-white">✕</button>
              </div>

              <div className="bg-gray-950 rounded-xl p-4 font-mono text-xs text-green-400 overflow-x-auto max-h-96">
                <pre>{JSON.stringify({ previous: selectedLog.previousValue, new: selectedLog.newValue }, null, 2)}</pre>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
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

