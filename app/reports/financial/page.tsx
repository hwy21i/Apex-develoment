"use client";

import AppShell from "@/components/layout/AppShell";
import { FileText, Download, DollarSign, BarChart3, TrendingUp } from "lucide-react";

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

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Financial & Commercial Reports</h1>
            <p className="text-gray-400 text-sm mt-1">
              Project profitability statements, cash flow forecasts, cost accounting, and tax filings
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <FileText size={16} />
            Export Ledger
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((r, i) => (
            <div
              key={i}
              className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col justify-between hover:border-gray-600 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">
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

