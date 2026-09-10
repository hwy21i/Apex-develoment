"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  FileText,
  Download,
  Calendar,
  Filter,
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

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <FileText className="w-4 h-4" /> Enterprise Business Intelligence
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Reports & Executive Analytics
            </h1>
            <p className="text-sm text-slate-400 mt-1">
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
                className="rounded-xl border border-[#232733] bg-[#141720] p-5 shadow-sm flex flex-col justify-between hover:border-blue-500/50 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {rep.category}
                    </span>
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-base font-semibold text-white leading-snug">
                    {rep.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {rep.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#1F2330] flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">Format: PDF / XLSX</span>
                  <button className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300">
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

