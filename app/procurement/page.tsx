"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Building,
  DollarSign,
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("requests");

  async function fetchRequests() {
    setLoading(true);
    try {
      const res = await fetch("/api/records/procurement");
      const json = await res.json();
      if (json.success && json.data?.items) {
        setRequests(
          json.data.items.map((r: any) => ({
            _id: r._id,
            requestNumber: r.data?.requestNumber || "MR-2026-" + r._id.slice(-4).toUpperCase(),
            projectName: r.title || "Addis Heights Mixed-Use Tower",
            requiredByDate: r.data?.requiredByDate || "2026-09-15",
            priority: r.data?.priority || "HIGH",
            status: r.status || "APPROVED",
            itemCount: r.data?.itemCount || 4,
            reason: r.data?.reason || "Foundation level concrete pour phase 2",
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

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

          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors shrink-0">
            <Plus className="w-4 h-4" /> New Material Request
          </button>
        </div>

        {/* Procurement Pipeline Tabs */}
        <div className="flex gap-2 border-b border-[#232733] pb-2 overflow-x-auto text-xs font-medium">
          {[
            { id: "requests", label: "Material Requests" },
            { id: "orders", label: "Purchase Orders (POs)" },
            { id: "receipts", label: "Goods Receipts (GRNs)" },
            { id: "suppliers", label: "Supplier Directory" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-[#1A1D27]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

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
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      No material requests submitted yet. Click &quot;New Material Request&quot; above.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
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

