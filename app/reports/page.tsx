"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import { exportCsv, csvSlug } from "@/lib/exportCsv";
import {
  FileText,
  Download,
  BarChart3,
  PieChart,
  DollarSign,
  Boxes,
  Users,
  HardHat,
} from "lucide-react";

export default function ReportsPage() {
  const reportCards = [
    {
      title: "Project Progress & Milestone Realization",
      category: "Project Management",
      icon: BarChart3,
      desc: "Earned Value Analysis (EVA), planned vs actual completion percentages, and milestone critical path delay projections.",
    },
    {
      title: "Budget Variance & Cost Ledger (ETB)",
      category: "Finance",
      icon: DollarSign,
      desc: "Comprehensive CSI division cost breakdown, committed purchase orders, actual site expenses, and variance analysis.",
    },
    {
      title: "Material Consumption & Inventory Valuation",
      category: "Supply Chain",
      icon: Boxes,
      desc: "Reorder points, moving average costs, shrinkage metrics, and site stock movements across warehouses.",
    },
    {
      title: "Workforce Hours & Labor Cost Allocation",
      category: "People & HR",
      icon: Users,
      desc: "Crew shift attendance, trade contractor hours, overtime expenditures, and safety compliance audits.",
    },
    {
      title: "Machinery Utilization & Fleet OEE",
      category: "Equipment",
      icon: HardHat,
      desc: "Engine operating hours, fuel economy, preventive service schedules, and maintenance cost per machine.",
    },
    {
      title: "Multi-Country Project Locations & Regional Distribution",
      category: "Administration",
      icon: PieChart,
      desc: "Geographic portfolio breakdown across regions, zones, and cities with localized currency valuations.",
    },
  ];

  const handleExportReport = (rep: { title: string; category: string; desc: string }) => {
    exportCsv(`report-${csvSlug(rep.title)}.csv`, [
      ["Report", rep.title],
      ["Category", rep.category],
      ["Description", rep.desc],
      ["Format", "PDF / XLSX"],
    ]);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <FileText className="w-4 h-4" /> Enterprise Business Intelligence
            </div>
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Reports & Executive Analytics
            </h1>
            <p className="text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Generate and export operational, financial, and workforce analytics across all construction projects.
            </p>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reportCards.map((rep) => {
            const Icon = rep.icon;
            return (
              <div
                key={rep.title}
                className="rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-5 shadow-sm flex flex-col justify-between hover:border-[#000000] dark:hover:border-[#FFFFFF] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] bg-[#F5F5F5] dark:bg-[#171717] px-2 py-0.5 rounded border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF]">
                      {rep.category}
                    </span>
                    <Icon className="w-4 h-4 text-[#666666] dark:text-[#A3A3A3]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#000000] dark:text-[#FFFFFF] leading-snug">
                    {rep.title}
                  </h3>
                  <p className="text-xs text-[#666666] dark:text-[#A3A3A3] mt-2 leading-relaxed">
                    {rep.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] flex items-center justify-between">
                  <span className="text-[11px] text-[#666666] dark:text-[#A3A3A3] font-mono">Format: PDF / XLSX</span>
                  <button
                    type="button"
                    onClick={() => handleExportReport(rep)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Report
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

