"use client";

import React, { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  FileText,
  Download,
  BarChart3,
  DollarSign,
  Boxes,
  Users,
  ShoppingCart,
  Truck,
  Loader2,
  CheckCircle,
} from "lucide-react";

export default function ReportsPage() {
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const reportCards = [
    {
      title: "Project Progress & Milestone Realization",
      type: "project-overview",
      category: "Project Management",
      icon: BarChart3,
      desc: "Earned Value Analysis (EVA), planned vs actual completion percentages, contract valuations, and milestone delay projections.",
    },
    {
      title: "Budget Variance & Cost Ledger (ETB)",
      type: "budget-variance",
      category: "Finance",
      icon: DollarSign,
      desc: "Comprehensive CSI division cost breakdown, committed purchase orders, actual site expenses, and variance analysis.",
    },
    {
      title: "Material Consumption & Inventory Valuation",
      type: "materials-inventory",
      category: "Supply Chain",
      icon: Boxes,
      desc: "Stock levels, engineering specifications, unit costs (ETB), reorder alerts, and total warehouse inventory valuations.",
    },
    {
      title: "Procurement & Purchase Requisitions",
      type: "procurement-orders",
      category: "Purchasing",
      icon: ShoppingCart,
      desc: "Detailed audit of material requisitions, multi-unit quantities, budget threshold checks, and approved POs.",
    },
    {
      title: "Goods Receipts & Delivery Tracking (GRN)",
      type: "delivery-tracking",
      category: "Logistics",
      icon: Truck,
      desc: "Traceability records of material arrivals, accepted vs rejected quality inspections, carrier tracking, and inventory postings.",
    },
    {
      title: "Site Tasks Breakdown & Workforce Execution",
      type: "tasks-workforce",
      category: "Operations",
      icon: Users,
      desc: "Trade deliverable logs, trade contractor hours, priority execution matrices, and milestone completion audits.",
    },
  ];

  const handleExportPdf = async (rep: typeof reportCards[0]) => {
    setDownloadingType(rep.type);
    setFeedback(null);
    try {
      const res = await fetch(`/api/reports/pdf?type=${rep.type}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to generate PDF report from server.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `apex-${rep.type}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setFeedback(`Downloaded "${rep.title}" PDF report successfully.`);
    } catch (err) {
      // Fallback
      window.open(`/api/reports/pdf?type=${rep.type}`, "_blank");
    } finally {
      setDownloadingType(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <FileText className="w-4 h-4" /> Enterprise Business Intelligence &amp; PDF Exports
            </div>
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Reports &amp; Executive Analytics
            </h1>
            <p className="text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Generate and download authentic, multi-page construction PDF reports formatted for executive review.
            </p>
          </div>
        </div>

        {feedback && (
          <div className="p-3.5 rounded-xl bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] border border-[#111111] dark:border-[#FFFFFF] font-semibold text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Reports Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reportCards.map((rep) => {
            const Icon = rep.icon;
            const isDownloading = downloadingType === rep.type;
            return (
              <div
                key={rep.title}
                className="v18-card p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] bg-[#F5F5F5] dark:bg-[#171717] px-2 py-0.5 rounded border border-[#D4D4D4] dark:border-[#303030]">
                      {rep.category}
                    </span>
                    <Icon className="w-4 h-4 text-[#666666] dark:text-[#A3A3A3]" />
                  </div>
                  <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF] leading-snug">
                    {rep.title}
                  </h3>
                  <p className="text-xs text-[#666666] dark:text-[#A3A3A3] mt-2 leading-relaxed">
                    {rep.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] flex items-center justify-between">
                  <span className="text-[10px] text-[#666666] dark:text-[#A3A3A3] font-mono">Format: Multi-Page PDF</span>
                  <button
                    type="button"
                    disabled={isDownloading}
                    onClick={() => handleExportPdf(rep)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{isDownloading ? "Generating..." : "Download PDF"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
