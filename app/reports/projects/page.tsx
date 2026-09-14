"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  FileText, Download, Filter, Calendar, BarChart2,
  TrendingUp, CheckCircle, Clock, AlertTriangle
} from "lucide-react";

export default function ProjectReportsPage() {
  const reports = [
    {
      title: "Monthly Portfolio Progress & Executive Summary",
      period: "January 2024",
      generatedDate: "2024-02-01",
      format: "PDF (14 pages)",
      type: "Executive",
      size: "4.8 MB",
    },
    {
      title: "Earned Value Management (EVM) CPI/SPI Report",
      period: "Q4 2023 - Q1 2024",
      generatedDate: "2024-02-05",
      format: "Excel / PDF",
      type: "Cost & Schedule",
      size: "2.1 MB",
    },
    {
      title: "Addis Heights Tower - Structural Deck Inspection Digest",
      period: "Bi-Weekly",
      generatedDate: "2024-02-06",
      format: "PDF (8 pages)",
      type: "Site Quality",
      size: "8.5 MB",
    },
    {
      title: "Subcontractor Performance & Claims Evaluation",
      period: "Year-To-Date",
      generatedDate: "2024-01-31",
      format: "PDF (12 pages)",
      type: "Commercial",
      size: "3.2 MB",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Project Progress & Milestone Reports</h1>
            <p className="text-gray-400 text-sm mt-1">
              Earned value management (EVM), physical vs financial progress, and executive digests
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <FileText size={16} />
            Generate Custom Report
          </button>
        </div>

        {/* Reports list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((r, i) => (
            <div
              key={i}
              className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col justify-between hover:border-gray-600 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">
                    {r.type}
                  </span>
                  <span className="text-xs text-gray-400">{r.format}</span>
                </div>
                <h3 className="text-base font-bold text-white mt-2">{r.title}</h3>
                <p className="text-xs text-gray-400 mt-1">Reporting Period: {r.period}</p>
                <p className="text-xs text-gray-500 mt-0.5">Generated: {r.generatedDate} • {r.size}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-700 flex justify-end">
                <button className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold">
                  <Download size={14} /> Download Report
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

