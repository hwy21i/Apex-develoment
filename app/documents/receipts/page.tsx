"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Receipt, Download, Calendar, Eye,
  Tag, CheckCircle, FileText, Image as ImageIcon
} from "lucide-react";

interface ScannedReceipt {
  _id: string;
  receiptNumber: string;
  vendorOrIssuer: string;
  category: "Fuel Slip" | "Petty Cash" | "Municipal Tax / Fee" | "Store Purchase" | "Bank Deposit Slip";
  projectName: string;
  amountETB: number;
  date: string;
  uploadedBy: string;
  verified: boolean;
}

const MOCK_RECEIPTS: ScannedReceipt[] = [
  {
    _id: "rc1",
    receiptNumber: "RCPT-2024-081",
    vendorOrIssuer: "TotalEnergies Bole Roundabout",
    category: "Fuel Slip",
    projectName: "Addis Heights Tower",
    amountETB: 45000,
    date: "2024-02-05",
    uploadedBy: "Abebe Kebede",
    verified: true,
  },
  {
    _id: "rc2",
    receiptNumber: "RCPT-2024-082",
    vendorOrIssuer: "Commercial Bank of Ethiopia - Deposit #8812",
    category: "Bank Deposit Slip",
    projectName: "Addis Heights Tower",
    amountETB: 10625000,
    date: "2024-02-01",
    uploadedBy: "Henok Tadesse",
    verified: true,
  },
  {
    _id: "rc3",
    receiptNumber: "RCPT-2024-083",
    vendorOrIssuer: "Addis Hardware & Tools Market",
    category: "Store Purchase",
    projectName: "Bole Business Park",
    amountETB: 18400,
    date: "2024-02-04",
    uploadedBy: "Dawit Haile",
    verified: true,
  },
];

export default function DocumentReceiptsPage() {
  const [receipts, setReceipts] = useState<ScannedReceipt[]>(MOCK_RECEIPTS);
  const [search, setSearch] = useState("");

  const filtered = receipts.filter(
    (r) =>
      r.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.vendorOrIssuer.toLowerCase().includes(search.toLowerCase()) ||
      r.projectName.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n: number) =>
    `ETB ${n.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Scanned Receipts & Payment Slips</h1>
            <p className="text-gray-400 text-sm mt-1">
              Field fuel tickets, bank deposit slips, petty cash vouchers, and verified tax invoices
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Scan / Upload Receipt
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search receipts by vendor, number, project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Receipt #</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Issuer / Vendor</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Category</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Project</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Date</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Amount</th>
                  <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Verification</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-blue-400 font-medium text-xs">{r.receiptNumber}</td>
                    <td className="px-4 py-3 text-white font-medium">{r.vendorOrIssuer}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{r.category}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{r.projectName}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(r.date).toLocaleDateString("en-ET")}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-white">{fmt(r.amountETB)}</td>
                    <td className="px-4 py-3 text-center">
                      {r.verified ? (
                        <span className="inline-flex items-center gap-1 text-green-400 text-xs">
                          <CheckCircle size={14} /> Audited
                        </span>
                      ) : (
                        <span className="text-yellow-400 text-xs">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-blue-400 hover:text-blue-300 p-1" title="View scanned voucher">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

