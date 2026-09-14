"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  ShieldAlert, Search, Filter, Clock, User, Globe,
  FileCode, CheckCircle, RefreshCw, Eye
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

const FALLBACK_LOGS: AuditLogEntry[] = [
  {
    _id: "log1",
    userName: "System Super Administrator",
    userRole: "Admin",
    action: "UPDATE",
    entity: "Project",
    entityId: "65c3b12389e1a",
    ipAddress: "197.156.104.22",
    createdAt: "2024-02-07T11:20:00Z",
    newValue: { status: "Active", budgetETB: 48000000 },
  },
  {
    _id: "log2",
    userName: "Abebe Kebede",
    userRole: "Project Manager",
    action: "APPROVE",
    entity: "MaterialRequest",
    entityId: "MR-2024-001",
    ipAddress: "197.156.104.45",
    createdAt: "2024-02-07T09:42:00Z",
    newValue: { status: "Approved", totalValueETB: 1350000 },
  },
  {
    _id: "log3",
    userName: "Henok Tadesse",
    userRole: "Accountant",
    action: "CREATE",
    entity: "Payment",
    entityId: "TRX-ETB-2024-881",
    ipAddress: "197.156.105.12",
    createdAt: "2024-02-06T15:30:00Z",
    newValue: { amountETB: 10625000, type: "Inflow" },
  },
  {
    _id: "log4",
    userName: "Tigist Alemu",
    userRole: "Procurement Officer",
    action: "DISPATCH",
    entity: "PurchaseOrder",
    entityId: "PO-2024-0001",
    ipAddress: "197.156.104.78",
    createdAt: "2024-02-06T11:15:00Z",
    newValue: { status: "Sent", totalAmountETB: 1350000 },
  },
  {
    _id: "log5",
    userName: "Kassahun Bekele",
    userRole: "Warehouse Manager",
    action: "CREATE",
    entity: "InventoryTransaction",
    entityId: "GRN-2024-0089",
    ipAddress: "197.156.105.80",
    createdAt: "2024-02-05T16:00:00Z",
    newValue: { type: "Inbound (GRN)", quantity: 150 },
  },
];

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-500/20 text-green-400 border border-green-500/30",
  UPDATE: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  DELETE: "bg-red-500/20 text-red-400 border border-red-500/30",
  APPROVE: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  DISPATCH: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>(FALLBACK_LOGS);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        const res = await fetch("/api/audit-logs");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && json.data.length > 0) {
            setLogs(json.data);
          }
        }
      } catch (err) {
        // Fallback already in place
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
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

