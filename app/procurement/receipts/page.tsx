"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Truck, CheckCircle, Clock, AlertTriangle,
  Eye, FileText, PackageCheck, Warehouse, ArrowUpRight
} from "lucide-react";

interface GoodsReceipt {
  _id: string;
  grnNumber: string;
  poNumber: string;
  supplierName: string;
  projectName: string;
  warehouseName: string;
  receivedDate: string;
  receivedBy: string;
  status: "Verified" | "Discrepancy" | "Pending Inspection";
  itemsCount: number;
  totalReceivedQty: number;
  totalValue: number;
  deliveryNoteNumber: string;
}

const MOCK_RECEIPTS: GoodsReceipt[] = [
  {
    _id: "grn1",
    grnNumber: "GRN-2024-0089",
    poNumber: "PO-2024-0002",
    supplierName: "Ethiopian Aggregate Industries",
    projectName: "Ring Road Expansion",
    warehouseName: "Site Warehouse A - Ring Road",
    receivedDate: "2024-02-04",
    receivedBy: "Kassahun Bekele (Storekeeper)",
    status: "Verified",
    itemsCount: 1,
    totalReceivedQty: 150,
    totalValue: 225000,
    deliveryNoteNumber: "DN-9941",
  },
  {
    _id: "grn2",
    grnNumber: "GRN-2024-0090",
    poNumber: "PO-2024-0003",
    supplierName: "Tekle Steel Works Plc",
    projectName: "Bole Business Park",
    warehouseName: "Central Logistics Hub",
    receivedDate: "2024-02-02",
    receivedBy: "Mulugeta Assefa (Quality Officer)",
    status: "Discrepancy",
    itemsCount: 2,
    totalReceivedQty: 28,
    totalValue: 1820000,
    deliveryNoteNumber: "DN-4412",
  },
  {
    _id: "grn3",
    grnNumber: "GRN-2024-0091",
    poNumber: "PO-2024-0001",
    supplierName: "Addis Construction Supply Co.",
    projectName: "Addis Heights Tower",
    warehouseName: "Addis Heights Main Store",
    receivedDate: "2024-02-06",
    receivedBy: "Solomon Worku (Site Engineer)",
    status: "Pending Inspection",
    itemsCount: 2,
    totalReceivedQty: 500,
    totalValue: 750000,
    deliveryNoteNumber: "DN-8802",
  },
];

const STATUS_BADGES: Record<string, string> = {
  Verified: "bg-green-500/20 text-green-400 border border-green-500/30",
  Discrepancy: "bg-red-500/20 text-red-400 border border-red-500/30",
  "Pending Inspection": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
};

export default function GoodsReceiptsPage() {
  const [receipts, setReceipts] = useState<GoodsReceipt[]>(MOCK_RECEIPTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = receipts.filter((r) => {
    const matchSearch =
      r.grnNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      r.deliveryNoteNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const fmt = (n: number) =>
    `ETB ${n.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Goods Receipts (GRN)</h1>
            <p className="text-gray-400 text-sm mt-1">
              Confirm material deliveries, update inventory ledgers, and match purchase orders
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Receive Delivery
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total GRNs</p>
            <p className="text-xl font-bold text-white mt-1">{receipts.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Verified Into Inventory</p>
            <p className="text-xl font-bold text-green-400 mt-1">
              {receipts.filter((r) => r.status === "Verified").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Flagged Discrepancies</p>
            <p className="text-xl font-bold text-red-400 mt-1">
              {receipts.filter((r) => r.status === "Discrepancy").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Received Inventory Value</p>
            <p className="text-xl font-bold text-blue-400 mt-1">
              {fmt(receipts.reduce((sum, r) => sum + r.totalValue, 0))}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by GRN#, PO#, Supplier, Delivery Note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Verified">Verified</option>
            <option value="Discrepancy">Discrepancy</option>
            <option value="Pending Inspection">Pending Inspection</option>
          </select>
        </div>

        {/* Receipts table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">GRN #</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">PO & Supplier</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Project & Warehouse</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Received Date</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Received By</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Value</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-blue-400 font-medium">{r.grnNumber}</span>
                      <p className="text-gray-500 text-xs mt-0.5">DN: {r.deliveryNoteNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">{r.supplierName}</span>
                      <p className="font-mono text-gray-400 text-xs mt-0.5">{r.poNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-xs">{r.projectName}</p>
                      <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                        <Warehouse size={11} /> {r.warehouseName}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">
                      {new Date(r.receivedDate).toLocaleDateString("en-ET")}
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{r.receivedBy}</td>
                    <td className="px-4 py-3 font-semibold text-white">{fmt(r.totalValue)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-blue-400 hover:text-blue-300 p-1" title="View GRN Document">
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

