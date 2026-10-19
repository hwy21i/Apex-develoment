"use client";

import AppShell from "@/components/layout/AppShell";
import { exportCsv, csvSlug } from "@/lib/exportCsv";
import { FileText, Download } from "lucide-react";

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

  const columns = ["Title", "Type", "Period", "Generated", "Format", "Size"];

  const handleDownload = (r: (typeof reports)[number]) => {
    exportCsv(`report-projects-${csvSlug(r.title)}.csv`, [
      columns,
      [r.title, r.type, r.period, r.generatedDate, r.format, r.size],
    ]);
  };

  const handleGenerateCustom = () => {
    exportCsv("report-projects-all.csv", [
      columns,
      ...reports.map((r) => [r.title, r.type, r.period, r.generatedDate, r.format, r.size]),
    ]);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF]">Project Progress & Milestone Reports</h1>
            <p className="text-[#666666] dark:text-[#A3A3A3] text-sm mt-1">
              Earned value management (EVM), physical vs financial progress, and executive digests
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateCustom}
            className="flex items-center gap-2 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <FileText size={16} />
            Generate Custom Report
          </button>
        </div>

        {/* Reports list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((r, i) => (
            <div
              key={i}
              className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-5 flex flex-col justify-between hover:border-[#000000] dark:hover:border-[#FFFFFF] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-[#666666] dark:text-[#A3A3A3] font-medium">
                    {r.type}
                  </span>
                  <span className="text-xs text-[#666666] dark:text-[#A3A3A3]">{r.format}</span>
                </div>
                <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF] mt-2">{r.title}</h3>
                <p className="text-xs text-[#666666] dark:text-[#A3A3A3] mt-1">Reporting Period: {r.period}</p>
                <p className="text-xs text-[#666666] dark:text-[#A3A3A3] mt-0.5">Generated: {r.generatedDate} • {r.size}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDownload(r)}
                  className="flex items-center gap-1 text-xs text-[#000000] dark:text-[#FFFFFF] hover:underline font-semibold"
                >
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

