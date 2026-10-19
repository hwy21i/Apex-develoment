"use client";

import AppShell from "@/components/layout/AppShell";
import { exportCsv, csvSlug } from "@/lib/exportCsv";
import { Download } from "lucide-react";

export default function InventoryReportsPage() {
  const reports = [
    {
      title: "Monthly Stock Valuation & Reconciliation by Warehouse",
      period: "January 2024",
      generatedDate: "2024-02-01",
      format: "Excel / PDF",
      type: "Valuation",
      size: "3.1 MB",
    },
    {
      title: "Material Consumption & Wastage Variance Audit",
      period: "January 2024",
      generatedDate: "2024-02-04",
      format: "PDF (10 pages)",
      type: "Site Waste",
      size: "2.4 MB",
    },
    {
      title: "Slow-Moving, Dead Stock & Surplus Materials Digest",
      period: "Quarterly Audit",
      generatedDate: "2024-01-28",
      format: "Excel Sheet",
      type: "Audit",
      size: "1.5 MB",
    },
  ];

  const columns = ["Title", "Type", "Period", "Generated", "Format", "Size"];

  const handleDownload = (r: (typeof reports)[number]) => {
    exportCsv(`report-inventory-${csvSlug(r.title)}.csv`, [
      columns,
      [r.title, r.type, r.period, r.generatedDate, r.format, r.size],
    ]);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF]">Inventory & Warehouse Reports</h1>
            <p className="text-[#666666] dark:text-[#A3A3A3] text-sm mt-1">
              Stock valuations, physical inventory count reconciliations, and scrap audits
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

