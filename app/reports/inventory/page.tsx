"use client";

import AppShell from "@/components/layout/AppShell";
import { FileText, Download, Warehouse, Package, AlertTriangle } from "lucide-react";

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

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Inventory & Warehouse Reports</h1>
            <p className="text-gray-400 text-sm mt-1">
              Stock valuations, physical inventory count reconciliations, and scrap audits
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

