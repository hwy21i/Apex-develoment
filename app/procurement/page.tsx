"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import {
  ShoppingBag,
  Plus,
  Truck,
  ShieldCheck,
  ClipboardCheck,
  Layers,
  ArrowRight,
  Boxes,
  ShoppingCart,
  Eye,
} from "lucide-react";
import LiveDeliveryTracker from "@/components/procurement/LiveDeliveryTracker";
import { formatCurrency } from "@/lib/formatters/currency";

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
  const [activeTab, setActiveTab] = useState<"tracking" | "requests" | "overview">("tracking");

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
              <ShoppingBag className="w-4 h-4" /> Supply Chain &amp; Procurement Lifecycle
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Purchase Program &amp; Delivery Telemetry
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Material Requisition → Quality &amp; Quantity Inspection → PO Program → Live Checkpoint Tracking
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/procurement/orders"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] hover:bg-[#FAFAFA] dark:hover:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] text-xs font-bold shadow-xs transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Purchase Program (Quality/Qty)</span>
            </Link>

            <Link
              href="/procurement/requests"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold shadow-md transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Material Request</span>
            </Link>
          </div>
        </div>

        {/* 4 Top KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#666666] dark:text-[#A3A3A3] font-mono uppercase tracking-wider">
              <span>Purchase Programs</span>
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-[#000000] dark:text-[#FFFFFF] mt-1.5 font-mono">
              5 Types
            </div>
            <p className="mt-2 text-[11px] text-[#666666] dark:text-[#A3A3A3]">
              Bulk Contract, Direct Site, Emergency Requisition, Subcontract &amp; Lease
            </p>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#666666] dark:text-[#A3A3A3] font-mono uppercase tracking-wider">
              <span>Qty Fulfillment</span>
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-[#000000] dark:text-[#FFFFFF] mt-1.5 font-mono">
              98.2%
            </div>
            <p className="mt-2 text-[11px] text-[#666666] dark:text-[#A3A3A3]">
              Accepted vs. Ordered units across all active purchase orders
            </p>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#666666] dark:text-[#A3A3A3] font-mono uppercase tracking-wider">
              <span>Quality Compliance</span>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-[#000000] dark:text-[#FFFFFF] mt-1.5 font-mono">
              96.5%
            </div>
            <p className="mt-2 text-[11px] text-[#666666] dark:text-[#A3A3A3]">
              Grade A certified materials with lab test certificates on file
            </p>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#666666] dark:text-[#A3A3A3] font-mono uppercase tracking-wider">
              <span>Live Deliveries</span>
              <Truck className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-[#000000] dark:text-[#FFFFFF] mt-1.5 font-mono">
              Live GPS/Route
            </div>
            <p className="mt-2 text-[11px] text-[#666666] dark:text-[#A3A3A3]">
              Multi-waypoint weighbridge, toll &amp; gate check telemetry active
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-[#D4D4D4] dark:border-[#303030] pb-2 overflow-x-auto text-xs font-medium">
          {[
            { id: "tracking", label: "Live Delivery Tracker (Where It Has Been)" },
            { id: "requests", label: "Material Requests Pipeline" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] font-bold shadow-xs"
                  : "text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#FAFAFA] dark:hover:bg-[#171717] border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <Link
            href="/procurement/orders"
            className="px-4 py-2.5 rounded-xl text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-all whitespace-nowrap ml-auto font-semibold flex items-center gap-1.5"
          >
            <span>Open Purchase Orders Program</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Tab 1: Live Delivery Tracking */}
        {activeTab === "tracking" && (
          <div className="animate-fadeIn">
            <LiveDeliveryTracker />
          </div>
        )}

        {/* Tab 2: Requests Table */}
        {activeTab === "requests" && (
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl overflow-hidden shadow-xs animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider font-mono text-[10px] border-b border-[#D4D4D4] dark:border-[#303030]">
                  <tr>
                    <th className="px-5 py-3.5">MR Number</th>
                    <th className="px-5 py-3.5">Project</th>
                    <th className="px-5 py-3.5">Priority</th>
                    <th className="px-5 py-3.5">Required By</th>
                    <th className="px-5 py-3.5">Line Items</th>
                    <th className="px-5 py-3.5">Reason / Justification</th>
                    <th className="px-5 py-3.5 text-center">Workflow Status</th>
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
                        <td className="px-5 py-3.5 font-mono text-[#666666] dark:text-[#A3A3A3]">
                          {r.requiredByDate}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[#000000] dark:text-[#FFFFFF]">
                          {r.itemCount} items
                        </td>
                        <td className="px-5 py-3.5 text-[#666666] dark:text-[#A3A3A3] max-w-xs truncate">
                          {r.reason}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]">
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
        )}
      </div>
    </AppShell>
  );
}
