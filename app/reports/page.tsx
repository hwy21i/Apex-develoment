"use client";

import React, { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { downloadReportPdf } from "@/lib/exportPdf";
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
  AlertTriangle,
  ShieldCheck,
  Building2,
  Clock,
  Archive,
} from "lucide-react";

export default function ReportsPage() {
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [downloadingMaster, setDownloadingMaster] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  const reportCards = [
    {
      title: "Project Progress & Milestone Realization",
      type: "project-overview",
      category: "Project Management",
      icon: BarChart3,
      desc: "Earned Value Analysis (EVA), planned vs actual completion percentages, contract valuations, and milestone delay projections.",
    },
    {
      title: "Completed & Historical Projects Dossier",
      type: "completed-projects",
      category: "Archive & History",
      icon: Archive,
      desc: "Comprehensive historical records of completed and handed-over projects, closed-out financials, milestone archives, and final metrics.",
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

  const handleDownloadMaster = async () => {
    setDownloadingMaster(true);
    setFeedback(null);
    const result = await downloadReportPdf("master-executive", {
      title: "Master Executive Intelligence Dossier",
      filename: `Apex_Master_Executive_Report_${new Date().toISOString().split("T")[0]}.pdf`,
      onSuccess: (filename) => {
        setFeedback({ message: `Master Executive Dossier downloaded successfully: ${filename}` });
      },
      onError: (errMsg) => {
        setFeedback({ message: errMsg, isError: true });
      },
    });
    setDownloadingMaster(false);
  };

  const handleExportPdf = async (rep: (typeof reportCards)[0]) => {
    setDownloadingType(rep.type);
    setFeedback(null);
    const result = await downloadReportPdf(rep.type, {
      title: rep.title,
      onSuccess: (filename) => {
        setFeedback({ message: `Report downloaded successfully: ${filename}` });
      },
      onError: (errMsg) => {
        setFeedback({ message: errMsg, isError: true });
      },
    });
    setDownloadingType(null);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <FileText className="w-4 h-4" /> Enterprise Business Intelligence &amp; PDF Exports
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Reports &amp; Executive Analytics
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Generate and download authentic, multi-page construction PDF reports formatted for executive review.
            </p>
          </div>

          <button
            onClick={handleDownloadMaster}
            disabled={downloadingMaster}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold shadow-md transition-all shrink-0 disabled:opacity-50"
          >
            {downloadingMaster ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{downloadingMaster ? "Compiling..." : "Download Master ERP Report (PDF)"}</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl font-semibold text-xs flex items-center gap-2 animate-in fade-in ${
              feedback.isError
                ? "bg-[#111111] text-[#FFFFFF] border border-[#303030] dark:bg-[#1F1F1F] dark:border-[#555555]"
                : "bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] border border-[#111111] dark:border-[#FFFFFF]"
            }`}
          >
            {feedback.isError ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
            ) : (
              <CheckCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Master Executive Intelligence Dossier Hero Card */}
        <div className="v18-card animate-v18-spring relative overflow-hidden rounded-2xl p-6 sm:p-7 bg-[#000000] text-[#FFFFFF] dark:bg-[#111111] border border-[#303030] shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1F1F1F] text-[#D4D4D4] border border-[#303030] text-[10px] font-mono uppercase tracking-wider font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span>Full ERP Compliance Audit &bull; 6 Core Pillars</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Complete Master ERP Executive Dossier
            </h2>
            <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed">
              Consolidates all 6 construction pillars into one auditable corporate publication: Project Portfolio Execution, CSI Budget Ledgers &amp; Expenses, Purchase Quality &amp; Quantity Fulfillment, Live Inbound Delivery Checkpoints (&ldquo;Where It Has Been&rdquo;), Site Tasks, and Security Audit Trail (Who, What, When).
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleDownloadMaster}
              disabled={downloadingMaster}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-white text-black hover:bg-[#D4D4D4] text-xs font-extrabold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {downloadingMaster ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <Download className="w-4 h-4 text-black" />
              )}
              <span>{downloadingMaster ? "Compiling Executive PDF..." : "Download Complete Master ERP Report (PDF)"}</span>
            </button>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reportCards.map((rep) => {
            const Icon = rep.icon;
            const isDownloading = downloadingType === rep.type;
            return (
              <div
                key={rep.title}
                className="v18-card p-5 shadow-xs flex flex-col justify-between border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] rounded-2xl"
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
