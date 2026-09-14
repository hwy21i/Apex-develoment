"use client";

import AppShell from "@/components/layout/AppShell";
import { FileText, Download, ShoppingCart, Truck, Star } from "lucide-react";

export default function ProcurementReportsPage() {
  const reports = [
    {
      title: "Vendor Spend, Price Variance & Delivery Lead-Time Audit",
      period: "January 2024",
      generatedDate: "2024-02-02",
      format: "Excel / PDF",
      type: "Supply Chain",
      size: "2.7 MB",
    },
    {
      title: "Open Purchase Orders & Pending Goods Receipts (GRN) Digest",
      period: "Weekly Dispatch",
      generatedDate: "2024-02-07",
      format: "PDF (6 pages)",
      type: "Logistics",
      size: "1.9 MB",
    },
    {
      title: "Supplier Quality Rating & Defect Discrepancy Log",
      period: "Quarterly Audit",
      generatedDate: "2024-01-25",
      format: "PDF (9 pages)",
      type: "Vendor Rating",
      size: "3.2 MB",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Procurement & Supply Chain Reports</h1>
            <p className="text-gray-400 text-sm mt-1">
              Vendor lead times, purchase order cycle efficiency, and supplier performance scorecards
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
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-medium">
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

