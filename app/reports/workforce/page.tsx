"use client";

import AppShell from "@/components/layout/AppShell";
import { FileText, Download, Users, HardHat, ShieldCheck } from "lucide-react";

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

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Workforce & Safety Reports</h1>
            <p className="text-gray-400 text-sm mt-1">
              Field labor hours, biometric attendance logs, HSE safety incident digests, and trade headcount
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((r, i) => (
            <div
              key={i}
              className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col justify-between hover:border-gray-600 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-medium">
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

