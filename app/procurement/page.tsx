"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import {
  ShoppingBag,
  Plus,
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

interface ProcurementRecordItem {
  _id: string;
  title?: string;
  status?: string;
  data?: {
    requestNumber?: string;
    requiredByDate?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    itemCount?: number;
    reason?: string;
  };
}

export default function ProcurementPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("requests");

  async function fetchRequests() {
    try {
      const res = await fetch("/api/records/procurement");
      const json = await res.json();
      if (json.success && json.data?.items) {
        setRequests(
          json.data.items.map((r: ProcurementRecordItem) => ({
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
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) {
        fetchRequests();
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <ShoppingBag className="w-4 h-4" /> Supply Chain & Procurement Lifecycle
            </div>
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Procurement & Purchase Orders
            </h1>
            <p className="text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Material Request → Approval → Purchase Order → Goods Receipt Note (GRN) → Supplier Invoice.
            </p>
          </div>

          <Link
            href="/procurement/requests"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-semibold shadow-md transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> New Material Request
          </Link>
        </div>

        {/* Procurement Pipeline Tabs */}
        <div className="flex gap-2 border-b border-[#D4D4D4] dark:border-[#303030] pb-2 overflow-x-auto text-xs font-medium">
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
                  ? "bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] font-semibold shadow-2xs"
                  : "text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#FAFAFA] dark:hover:bg-[#171717]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Requests Table */}
        <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#333333] dark:text-[#D4D4D4]">
              <thead className="bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider font-mono text-[11px] border-b border-[#D4D4D4] dark:border-[#303030]">
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
              <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-[#666666] dark:text-[#A3A3A3]">
                      Loading procurement pipeline records...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-[#666666] dark:text-[#A3A3A3]">
                      No material requests submitted yet. Click &quot;New Material Request&quot; above.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r._id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-[#000000] dark:text-[#FFFFFF]">
                        {r.requestNumber}
                      </td>
                      <td className="px-5 py-3.5 text-[#000000] dark:text-[#FFFFFF] font-medium">
                        {r.projectName}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]">
                          {r.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[#888888] dark:text-[#888888]">
                        {r.requiredByDate}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[#333333] dark:text-[#D4D4D4]">
                        {r.itemCount} items
                      </td>
                      <td className="px-5 py-3.5 text-[#888888] dark:text-[#888888] max-w-xs truncate">
                        {r.reason}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] border border-[#111111] dark:border-[#FFFFFF] font-semibold">
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

