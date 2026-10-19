"use client";

import AppShell from "@/components/layout/AppShell";
import { exportCsv, csvSlug } from "@/lib/exportCsv";
import { Download } from "lucide-react";

export default function WorkforceReportsPage() {
  const reports = [
    {
      title: "Monthly Site Labor Hours, Attendance & Overtime Digest",
      period: "January 2024",
      generatedDate: "2024-02-01",
      format: "Excel / PDF",
      type: "Time & Labor",
      size: "2.8 MB",
    },
    {
      title: "HSE Site Safety, Toolbox Talks & Incident-Free Hours Report",
      period: "January 2024",
      generatedDate: "2024-02-03",
      format: "PDF (8 pages)",
      type: "HSE Compliance",
      size: "3.5 MB",
    },
    {
      title: "Daily Wage & Direct Labor Payroll Distribution Report",
      period: "Bi-Weekly",
      generatedDate: "2024-02-05",
      format: "Excel Payroll Sheet",
      type: "Payroll",
      size: "1.4 MB",
    },
  ];

  const columns = ["Title", "Type", "Period", "Generated", "Format", "Size"];

  const handleDownload = (r: (typeof reports)[number]) => {
    exportCsv(`report-workforce-${csvSlug(r.title)}.csv`, [
      columns,
      [r.title, r.type, r.period, r.generatedDate, r.format, r.size],
    ]);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF]">Workforce & Safety Reports</h1>
            <p className="text-[#666666] dark:text-[#A3A3A3] text-sm mt-1">
              Field labor hours, biometric attendance logs, HSE safety incident digests, and trade headcount
            </p>
          </div>
        </div>

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

