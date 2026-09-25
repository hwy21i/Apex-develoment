"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Plus, Search } from "lucide-react";

interface OperationalRequest {
  _id: string;
  title?: string;
  status?: string;
  data?: { requestNumber?: string; requiredByDate?: string; priority?: RequestItem["priority"]; itemCount?: number; reason?: string };
}

interface RequestItem {
  _id: string;
  requestNumber: string;
  projectName?: string;
  requiredByDate: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: string;
  itemCount: number;
  reason: string;
}

export default function ProcurementPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const pathname = usePathname();

  async function fetchRequests() {
    setLoading(true);
    try {
      const res = await fetch("/api/records/procurement");
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Unable to load procurement requests.");
        return;
      }
      setRequests(((json.data?.items || []) as OperationalRequest[]).map((request) => ({
        _id: request._id,
        requestNumber: request.data?.requestNumber || `MR-${request._id.slice(-8).toUpperCase()}`,
        projectName: request.title || "Project unavailable",
        requiredByDate: request.data?.requiredByDate || "—",
        priority: request.data?.priority || "MEDIUM",
        status: request.status || "UNSPECIFIED",
        itemCount: request.data?.itemCount ?? 0,
        reason: request.data?.reason || "—",
      })));
      setError("");
    } catch {
      setError("Unable to connect to the procurement service.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => { void fetchRequests(); });
  }, []);

  const filteredRequests = requests.filter((request) => `${request.requestNumber} ${request.projectName} ${request.reason} ${request.status}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <ShoppingBag className="w-4 h-4" /> Supply Chain & Procurement Lifecycle
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Procurement & Purchase Orders
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Material Request → Approval → Purchase Order → Goods Receipt Note (GRN) → Supplier Invoice.
            </p>
          </div>

          <Link href="/procurement/requests" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors shrink-0">
            <Plus className="w-4 h-4" /> Material Requests
          </Link>
        </div>

        {/* Procurement Pipeline Tabs */}
        <div className="flex gap-2 border-b border-[#232733] pb-2 overflow-x-auto text-xs font-medium">
          {[
            { id: "requests", label: "Material Requests", href: "/procurement/requests" },
            { id: "orders", label: "Purchase Orders (POs)", href: "/procurement/orders" },
            { id: "receipts", label: "Goods Receipts (GRNs)", href: "/procurement/receipts" },
            { id: "suppliers", label: "Supplier Directory", href: "/procurement/suppliers" },
          ].map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
                pathname === tab.href
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-[#1A1D27]"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <label className="relative block max-w-md">
          <span className="sr-only">Search material requests</span>
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" aria-hidden="true" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests…" className="w-full rounded-lg border border-[#262C3D] bg-[#141720] py-2 pl-9 pr-3 text-xs text-slate-200 outline-none focus:border-blue-500" />
        </label>
        {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}

        {/* Requests Table */}
        <div className="bg-[#141720] border border-[#232733] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#181B24] text-slate-400 uppercase tracking-wider font-mono text-[11px] border-b border-[#232733]">
                <tr>
                  <th className="px-5 py-3">MR Number</th>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Required By</th>
                  <th className="px-5 py-3">Line Items</th>
                  <th className="px-5 py-3">Reason / Justification</th>
                  <th className="px-5 py-3">Workflow Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202432]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      Loading procurement pipeline records...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      {requests.length === 0 ? "No material requests are available." : "No requests match your search."}
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((r) => (
                    <tr key={r._id} className="hover:bg-[#1A1E29] transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-blue-400">
                        {r.requestNumber}
                      </td>
                      <td className="px-5 py-3.5 text-white font-medium">
                        {r.projectName}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {r.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-400">
                        {r.requiredByDate}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-300">
                        {r.itemCount} items
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 max-w-xs truncate">
                        {r.reason}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
