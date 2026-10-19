"use client";

import AppShell from "@/components/layout/AppShell";
import { exportCsv, csvSlug } from "@/lib/exportCsv";
import { FileText, Download } from "lucide-react";

export default function FinancialReportsPage() {
  const reports = [
    {
      title: "Consolidated Financial Statements & Balance Sheet",
      period: "Q4 2023 Audited",
      generatedDate: "2024-01-30",
      format: "PDF / Excel",
      type: "Statutory",
      size: "3.4 MB",
    },
    {
      title: "Project Cost Variance & Budget Run-Rate Report",
      period: "January 2024",
      generatedDate: "2024-02-05",
      format: "Excel (WBS breakdown)",
      type: "Cost Accounting",
      size: "1.8 MB",
    },
    {
      title: "Client Progress Billing (IPC) & Accounts Receivable Aging",
      period: "Current as of Feb 2024",
      generatedDate: "2024-02-07",
      format: "PDF (6 pages)",
      type: "Treasury",
      size: "2.5 MB",
    },
    {
      title: "Tax Deductions, Withholding (2%) & VAT (15%) Ledger",
      period: "Ethiopian Fiscal Month Tir 2016",
      generatedDate: "2024-02-08",
      format: "Excel / ERCA Ready",
      type: "Compliance",
      size: "1.2 MB",
    },
  ];

  const columns = ["Title", "Type", "Period", "Generated", "Format", "Size"];

  const handleDownload = (r: (typeof reports)[number]) => {
    exportCsv(`report-financial-${csvSlug(r.title)}.csv`, [
      columns,
      [r.title, r.type, r.period, r.generatedDate, r.format, r.size],
    ]);
  };

  const handleExportLedger = () => {
    exportCsv("report-financial-all.csv", [
      columns,
      ...reports.map((r) => [r.title, r.type, r.period, r.generatedDate, r.format, r.size]),
    ]);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF]">Financial & Commercial Reports</h1>
            <p className="text-[#666666] dark:text-[#A3A3A3] text-sm mt-1">
              Project profitability statements, cash flow forecasts, cost accounting, and tax filings
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportLedger}
            className="flex items-center gap-2 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <FileText size={16} />
            Export Ledger
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((r, i) => (
            <div
              key={i}
              className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-5 flex flex-col justify-between hover:border-[#000000] dark:hover:border-[#FFFFFF] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-0.5 rounded bg-[#F5F5F5] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030] font-medium">
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

