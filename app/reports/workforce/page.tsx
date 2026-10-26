"use client";

import React, { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { downloadReportPdf } from "@/lib/exportPdf";
import { Download, Loader2, FileText } from "lucide-react";

export default function WorkforceReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const reports = [
    {
      title: "Monthly Site Labor Hours, Attendance & Overtime Digest",
      period: "January 2024",
      generatedDate: "2024-02-01",
      format: "PDF Official",
      type: "Time & Labor",
      size: "2.8 MB",
    },
    {
      title: "HSE Site Safety, Toolbox Talks & Incident-Free Hours Report",
      period: "January 2024",
      generatedDate: "2024-02-03",
      format: "PDF Official",
      type: "HSE Compliance",
      size: "3.5 MB",
    },
    {
      title: "Daily Wage & Direct Labor Payroll Distribution Report",
      period: "Bi-Weekly",
      generatedDate: "2024-02-05",
      format: "PDF Official",
      type: "Payroll",
      size: "1.4 MB",
    },
  ];

  const handleDownload = async (r: (typeof reports)[number]) => {
    setDownloading(r.title);
    try {
      await downloadReportPdf("workforce", { title: r.title });
    } finally {
      setDownloading(null);
    }
  };

  const handleExportAll = async () => {
    setDownloading("all");
    try {
      await downloadReportPdf("workforce", { title: "Complete Site Tasks & Workforce Execution Summary" });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF]">Workforce & Safety Reports</h1>
            <p className="text-[#666666] dark:text-[#A3A3A3] text-sm mt-1">
              Field labor hours, biometric attendance logs, HSE safety incident digests, and trade headcount
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportAll}
            disabled={downloading === "all"}
            className="erp-btn-md bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] cursor-pointer"
          >
            {downloading === "all" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText size={16} />}
            <span>Export Workforce Digest (PDF)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((r, i) => (
            <div
              key={i}
              className="v18-card p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-0.5 rounded bg-[#F5F5F5] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] font-medium">
                    {r.type}
                  </span>
                  <span className="text-xs font-mono text-[#666666] dark:text-[#A3A3A3]">{r.format}</span>
                </div>
                <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF] mt-2">{r.title}</h3>
                <p className="text-xs text-[#666666] dark:text-[#A3A3A3] mt-1">Reporting Period: {r.period}</p>
                <p className="text-xs text-[#666666] dark:text-[#A3A3A3] mt-0.5">Generated: {r.generatedDate} • {r.size}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDownload(r)}
                  disabled={downloading === r.title}
                  className="erp-btn-sm bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] hover:opacity-90"
                >
                  {downloading === r.title ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download size={14} />}
                  <span>{downloading === r.title ? "Generating..." : "Download Official PDF"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
